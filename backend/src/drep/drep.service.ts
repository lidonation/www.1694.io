import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createDrepDto } from "src/dto";
import { DataSource, Repository } from "typeorm";
import { faker } from "@faker-js/faker";
import { Drep } from "src/entities/drep.entity";
import { ConnectionService } from "src/connection/connection.service";

@Injectable()
export class DrepService {
  constructor(
    @InjectRepository(Drep) private userRepo: Repository<Drep>,
    private connectionService: ConnectionService
  ) {}
  //get from cexplorer db
  async getAllDrepsCexplorer() {
    const queryInstance=await this.connectionService.addCexplorerConnection()
    const drepList = await queryInstance.manager.query(
      `WITH RankedRows AS (
          SELECT 
              dh.id AS drep_hash_id, 
              dh.raw, 
              dh.view, 
              dh.has_script,
              dd.id AS drep_distr_id, 
              dd.hash_id, 
              dd.amount, 
              dd.epoch_no, 
              dd.active_until,
              dr.id AS drep_registration_id, 
              dr.tx_id, 
              dr.cert_index, 
              dr.deposit, 
              dr.drep_hash_id AS reg_drep_hash_id, 
              dr.voting_anchor_id AS reg_voting_anchor_id,  
              va.id AS voting_anchor_id, 
              va.tx_id AS va_tx_id, 
              va.url, 
              va.data_hash, 
              va.type,
              sa.view AS stake_address,
              (
                  SELECT COUNT(*)
                  FROM delegation_vote
                  WHERE drep_hash_id = dh.id
              ) AS delegation_vote_count,
              ROW_NUMBER() OVER (PARTITION BY dh.id ORDER BY dd.epoch_no DESC) AS RowNum
          FROM 
              drep_hash AS dh
          JOIN 
              drep_distr AS dd ON dh.id = dd.hash_id
          LEFT JOIN 
              drep_registration AS dr ON dh.id = dr.drep_hash_id
          LEFT JOIN 
              voting_anchor AS va ON dr.voting_anchor_id = va.id
          LEFT JOIN 
              delegation_vote AS dv ON dh.id = dv.drep_hash_id 
          LEFT JOIN
              stake_address AS sa ON dv.addr_id = sa.id 
      )
      SELECT 
          drep_hash_id,
          view,
          delegation_vote_count,
          stake_address,
          amount,
          epoch_no,
          active_until,
          deposit,
          url,
          type
      FROM 
          RankedRows
      WHERE 
          RowNum = 1`
    );
    const drepListInADA = drepList.map((entry) => {
      return {
        ...entry,
        deposit: (entry.deposit / 1000000).toFixed(1), 
        amount: (entry.amount / 1000000).toFixed(1), 
      };
    });

    return drepListInADA;
  }
  async getSingleDrep(drepId: number) {
    const drepList = await this.userRepo.findOne({ where: { id: drepId } });
    if (!drepList) {
      throw new NotFoundException("Drep not found!");
    }
    return drepList;
  }
  async getAllDRepsVoltaire() {
    const queryInstance=await this.connectionService.addVoltaireConnection()
    return await queryInstance.getRepository('Drep').find()
  }
  async populateFakeDRepData() {
    const dreps = await this.getAllDrepsCexplorer();
    //seeding`
    const modified = dreps.map((drep) => {
      return {
        ...drep,
        name: faker.person.fullName(),
        bio: faker.lorem.sentences(2),
        stake_addr: drep.stake_address,
        voter_id: drep.view,
      };
    });
    const queryInstance=await this.connectionService.addVoltaireConnection()
    await queryInstance.getRepository('Drep').insert(modified)
    return modified;
  }
  async registerDrep(drepDto: createDrepDto) {
    const drep = await this.userRepo.create(drepDto);
    return await this.userRepo.save(drep);
  }
  async updateDrepInfo(drepId: number, drep: createDrepDto) {
    const foundDrep = await this.userRepo.findOne({ where: { id: drepId } });
    if (!foundDrep) {
      throw new NotFoundException("Drep to be updated not found!");
    }
    Object.keys(drep).forEach((key) => {
      foundDrep[key] = drep[key];
    });
    return await this.userRepo.save(foundDrep);
  }
}
