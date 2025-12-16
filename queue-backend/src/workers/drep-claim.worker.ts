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
  constructor(
    @InjectDataSource("default")
    private voltaireService: DataSource,
  ) {
    super();
  }
  async process(
    job: Job<DRepClaimJobData, DRepClaimJobResponse, any>,
    token?: string,
  ) {
    try {
      const { stakeKey } = job.data;

      const registeredDrep = await this.voltaireService
        .getRepository(Drep)
        .createQueryBuilder("drep")
        .leftJoin(
          "drep_delegators",
          "delegator",
          "delegator.drepId = drep.drepId",
        )
        .where("delegator.stakeAddress = :stakeKey", { stakeKey })
        .orWhere("drep.paymentAddress = :stakeKey", { stakeKey })
        .andWhere("drep.active = true")
        .andWhere("drep.retired = false")
        .getOne();

      if (!registeredDrep) {
        return {
          success: true,
          message: `No active DRep registration found for stake key ${stakeKey}`,
          isRegistered: false,
        };
      }

      const claimDto: DRepClaimJobResponse = {
        success: true,
        message: `Registration data for stake key ${stakeKey} processed successfully`,
        isRegistered: true,
        stakeKey,
        signature: job.data.signature,
        signatureKey: job.data.signatureKey,
        view: registeredDrep.drepId,
        retired: registeredDrep.retired,
      };

      const drepClaimResponse = await this.autoClaimDRep(claimDto);

      return {
        success: true,
        message: `DRep auto-claim processed successfully for stake key ${stakeKey}`,
        isRegistered: true,
        stakeKey,
        view: drepClaimResponse.view,
        drepId: drepClaimResponse.drepId,
      };
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  async autoClaimDRep(claimDto: DRepClaimJobResponse) {
    //to autoclaim a drep associated with the stake key
    const { stakeKey, isRegistered, retired, view } = claimDto;

    if (!isRegistered) {
      console.warn("Unable to auto-claim DRep, not registered");
      return {
        success: false,
        message: "DRep is not registered, auto-claim failed.",
        isRegistered: false,
        stakeKey,
        view,
      };
    }

    if (retired) {
      console.warn("Unable to auto-claim DRep, retired");
      return {
        success: false,
        message: "DRep is retired, auto-claim failed.",
        isRegistered: true,
        stakeKey,
        view,
      };
    }

    const existingDrep = await this.voltaireService
      .createQueryBuilder()
      .select(["drep.*", "signature.*"])
      .from("drep", "drep")
      .leftJoin("signature", "signature", 'signature."drepId" = drep.id')
      .where('signature."stakeKey" = :stakeKey', { stakeKey })
      .getRawOne();

    if (existingDrep) {
      console.warn("DRep already exists for this stake key");
      return {
        success: false,
        message: "DRep already exists for this stake key.",
        isRegistered: true,
        stakeKey,
        view: existingDrep.drep_bech32,
      };
    }

    const drepDto: createDrepDto = {
      voter_id: claimDto.view,
      drep_bech32: claimDto.view,
      stake_addr: claimDto.stakeKey,
      signatures: [
        {
          key: claimDto.signatureKey as string,
          signature: claimDto.signature as string,
          type: "drep",
        },
      ],
    };

    try {
      const { insertedDrep, insertedSig } = await this.registerDrep(drepDto);
      return {
        success: true,
        message: "DRep auto-claimed successfully.",
        isRegistered: true,
        view: insertedSig?.drep_bech32,
        stakeKey: insertedSig?.stakeKey,
        drepId: insertedDrep?.id,
      };
    } catch (error) {
      console.error("DRep registration failed:", error);
      return {
        success: false,
        message: "Failed to register DRep due to database error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async registerDrep(drepDto: createDrepDto) {
    return await this.voltaireService.transaction(async (manager) => {
      const insertedDrep = await manager
        .createQueryBuilder()
        .insert()
        .into("drep")
        .values({})
        .returning("id")
        .execute();

      const drepId = insertedDrep.raw[0].id;

      const signatureDto = {
        stakeKey: drepDto?.stake_addr,
        signature: drepDto?.signatures[0].signature,
        signatureKey: drepDto?.signatures[0].key,
        drep: drepId,
        voterId: drepDto?.voter_id,
        drep_bech32: drepDto.drep_bech32,
        type: drepDto?.signatures[0].type,
      };

      const existingSig = await manager
        .createQueryBuilder()
        .select(["signature.*", "drep.id as drep_id"])
        .from("signature", "signature")
        .leftJoin("drep", "drep", 'drep.id = signature."drepId"')
        .where('signature."stakeKey" = :stakeKey', {
          stakeKey: signatureDto.stakeKey,
        })
        .andWhere('signature."signatureKey" = :signatureKey', {
          signatureKey: signatureDto.signatureKey,
        })
        .getRawOne();

      let resultSig;

      if (existingSig) {
        if (!existingSig.drep_id) {
          const updatedSig = await manager
            .createQueryBuilder()
            .update("signature")
            .set({
              drepId: drepId,
              voterId: signatureDto.voterId,
              drep_bech32: signatureDto.drep_bech32,
            })
            .where("id = :id", { id: existingSig.id })
            .returning([
              "id",
              "drep_bech32",
              "signature",
              "signatureKey",
              "lastSignedIn",
              "type",
              "stakeKey",
              "voterId",
              "drepId",
            ])
            .execute();

          resultSig = updatedSig.raw[0];
        } else {
          resultSig = existingSig;
        }
      } else {
        const insertedSig = await manager
          .createQueryBuilder()
          .insert()
          .into("signature")
          .values({
            stakeKey: signatureDto.stakeKey,
            signature: signatureDto.signature,
            signatureKey: signatureDto.signatureKey,
            drepId: drepId,
            voterId: signatureDto.voterId,
            drep_bech32: signatureDto.drep_bech32 || "",
            type: signatureDto.type,
            lastSignedIn: new Date(),
          })
          .returning("*")
          .execute();

        resultSig = insertedSig.raw[0];
      }

      return {
        insertedDrep: insertedDrep.raw[0],
        insertedSig: resultSig,
        isUpdate: !!existingSig,
      };
    });
  }
}
