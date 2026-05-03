import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import {
  createDrepDto,
  DRepClaimJobData,
  DRepClaimJobResponse,
  Queues,
} from "../queue.types";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Drep } from "../entities/drep.entity";

@Processor(Queues.DREP_CLAIM, { concurrency: 10 })
export class DrepClaimWorker extends WorkerHost {
  private readonly logger = new Logger(DrepClaimWorker.name);

  constructor(
    @InjectDataSource("default")
    private voltaireService: DataSource,
  ) {
    super();
  }

  async process(job: Job<DRepClaimJobData, DRepClaimJobResponse>) {
    try {
      const { stakeKey } = job.data;
      const registeredDrep = await this.voltaireService.getRepository(Drep).createQueryBuilder("d")
        .leftJoin("drep_delegators", "del", "del.drepId = d.drepId")
        .where("del.stakeAddress = :stakeKey OR d.paymentAddress = :stakeKey", { stakeKey })
        .andWhere("d.active = true AND d.retired = false")
        .getOne();

      if (!registeredDrep) return { success: true, message: `No active DRep for ${stakeKey}`, isRegistered: false };

      const claimDto: DRepClaimJobResponse = {
        success: true, message: `Data for ${stakeKey} processed`, isRegistered: true, stakeKey,
        signature: job.data.signature, signatureKey: job.data.signatureKey, view: registeredDrep.drepId, retired: registeredDrep.retired,
      };

      const response = await this.autoClaimDRep(claimDto);
      return { success: true, message: 'DRep claimed', isRegistered: true, stakeKey, view: response.view, drepId: response.drepId };
    } catch (e) {
      this.logger.error(`Job ${job.id} failed: ${e.message}`);
      throw e;
    }
  }

  async autoClaimDRep(claim: DRepClaimJobResponse) {
    const { stakeKey, isRegistered, retired, view } = claim;
    if (!isRegistered) return { success: false, message: "Not registered", isRegistered: false, stakeKey, view };
    if (retired) return { success: false, message: "Retired", isRegistered: true, stakeKey, view };

    const existing = await this.voltaireService.createQueryBuilder().select(["d.*", "s.*"]).from("drep", "d")
      .leftJoin("signature", "s", 's."drepId" = d.id').where('s."stakeKey" = :stakeKey', { stakeKey }).getRawOne();

    if (existing) return { success: false, message: "DRep exists", isRegistered: true, stakeKey, view: existing.drep_bech32 };

    const dto: createDrepDto = { voter_id: view, drep_bech32: view, stake_addr: stakeKey, signatures: [{ key: claim.signatureKey as string, signature: claim.signature as string, type: "drep" }] };

    try {
      const { insertedDrep, insertedSig } = await this.registerDrep(dto);
      return { success: true, message: "Auto-claimed", isRegistered: true, view: insertedSig?.drep_bech32, stakeKey: insertedSig?.stakeKey, drepId: insertedDrep?.id };
    } catch (e) {
      this.logger.error(`Registration failed: ${e.message}`);
      return { success: false, message: "Registration failed", error: e.message };
    }
  }

  async registerDrep(dto: createDrepDto) {
    return await this.voltaireService.transaction(async (manager) => {
      const inserted = await manager.createQueryBuilder().insert().into("drep").values({}).returning("id").execute();
      const drepId = inserted.raw[0].id;

      const sig = { stakeKey: dto.stake_addr, signature: dto.signatures[0].signature, signatureKey: dto.signatures[0].key, drep: drepId, voterId: dto.voter_id, drep_bech32: dto.drep_bech32, type: dto.signatures[0].type };

      const existingSig = await manager.createQueryBuilder().select(["s.*", "d.id as d_id"]).from("signature", "s")
        .leftJoin("drep", "d", 'd.id = s."drepId"').where('s."stakeKey" = :sK AND s."signatureKey" = :sQ', { sK: sig.stakeKey, sQ: sig.signatureKey }).getRawOne();

      let resultSig;
      if (existingSig) {
        if (!existingSig.d_id) {
          const updated = await manager.createQueryBuilder().update("signature").set({ drepId, voterId: sig.voterId, drep_bech32: sig.drep_bech32 })
            .where("id = :id", { id: existingSig.id }).returning("*").execute();
          resultSig = updated.raw[0];
        } else resultSig = existingSig;
      } else {
        const insertedSig = await manager.createQueryBuilder().insert().into("signature").values({
          stakeKey: sig.stakeKey, signature: sig.signature, signatureKey: sig.signatureKey, drepId, voterId: sig.voterId, drep_bech32: sig.drep_bech32 || "", type: sig.type, lastSignedIn: new Date(),
        }).returning("*").execute();
        resultSig = insertedSig.raw[0];
      }
      return { insertedDrep: inserted.raw[0], insertedSig: resultSig, isUpdate: !!existingSig };
    });
}
