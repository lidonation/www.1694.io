import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createDrepDto } from "src/dto";
import { DataSource, Repository } from "typeorm";
import { faker } from "@faker-js/faker";
import { Drep } from "src/entities/drep.entity";
import { ConnectionService } from "src/connection/conn.service";

@Injectable()
export class DrepService {
  constructor(
    @InjectRepository(Drep) private userRepo: Repository<Drep>,
    private connection: DataSource,
    private connService: ConnectionService
  ) {}
  async initializequeryRunner() {
    const queryRunner = this.connection.createQueryRunner();
    return queryRunner;
  }
  //get from cexplorer db
  async getAllDreps() {
    const queryInstance = await this.initializequeryRunner();
    await queryInstance.connect();
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
              sa.view AS stake_address, -- Added stake_address field
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
              stake_address AS sa ON dv.addr_id = sa.id -- Join to stake_addresses table
      )
      SELECT 
          drep_hash_id,
          view,
          delegation_vote_count,
          stake_address, -- Included stake_address
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

    //Map across the response to convert deposit and amount from lovelace to ADA
    const drepListInADA = drepList.map((entry) => {
      return {
        ...entry,
        deposit: (entry.deposit / 1000000).toFixed(1), // Convert deposit from lovelace to ADA
        amount: (entry.amount / 1000000).toFixed(1), // Convert amount from lovelace to ADA
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
    const connVol=await this.connService.addVoltaireConnection()
    return await connVol.getRepository('Drep').find()
  }
  async populateFakeDRepData() {
    const dreps = await this.getAllDreps();

    const modified = dreps.map((drep) => {
      return {
        ...drep,
        name: faker.person.fullName(),
        bio: faker.lorem.sentences(2),
        stake_addr: drep.stake_address,
        voter_id: drep.view,
      };
    });
    const connVol=await this.connService.addVoltaireConnection()
    await connVol.getRepository('Drep').insert(modified)
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
    // Iterate through the properties of the drep object
    Object.keys(drep).forEach((key) => {
      // Update the corresponding field in foundDrep with the value from drep
      foundDrep[key] = drep[key];
    });

    // Save the updated foundDrep object
    return await this.userRepo.save(foundDrep);
  }
}
