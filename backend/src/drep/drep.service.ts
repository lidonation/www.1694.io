import { Injectable, NotFoundException } from '@nestjs/common';
import { createDrepDto } from 'src/dto';
import { faker } from '@faker-js/faker';
import { AttachmentService } from 'src/attachment/attachment.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DrepService {
  constructor(
    @InjectDataSource('default')
    private voltaireService: DataSource,
    @InjectDataSource('dbsync')
    private cexplorerService: DataSource,
    private attachmentService: AttachmentService,
    private configService: ConfigService,
  ) {}
  //get from cexplorer db
  async getAllDrepsCexplorer() {
        console.log('dbsync::', this.configService.get<string>(
            'BLOCKFROST_SANCHONET_PROJECT_ID',
        ));
      console.log('dbsync_db::', this.configService.get('DATABASE_HOST_DBSYNC', 'dbsync_db'));

    const drepList = await this.cexplorerService.manager.query(
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
              va.url, 
              va.data_hash, 
              va.type,
              sa.view AS stake_address,
              (
                SELECT COUNT(DISTINCT dv.addr_id)
                FROM delegation_vote dv
                WHERE dv.drep_hash_id = dh.id
            ) AS delegation_vote_count,
              ROW_NUMBER() OVER (PARTITION BY dh.id ORDER BY dd.epoch_no DESC) AS RowNum
          FROM 
              drep_hash AS dh
          LEFT JOIN 
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
          RowNum = 1`,
    );

    return drepList.map((entry) => {
      return {
        ...entry,
        deposit: (entry.deposit / 1000000).toFixed(1),
        amount: (entry.amount / 1000000).toFixed(1),
      };
    });
  }
  async getAllDRepsVoltaire() {
    return await this.voltaireService.getRepository('Drep').find();
  }
  async getAllDreps() {
    // get both dreps from voltaire and cexplorer matching drep.view from cexplorer with drep.voter_id from voltaire
    const drepList = await this.getAllDrepsCexplorer();
    const voltaireDreps = await this.getAllDRepsVoltaire();
    //add all fields from voltaire to cexplorer, if no matching, the field can be null
    const mergedDreps = drepList.map((drep) => {
      const voltaireDrep = voltaireDreps.find(
        (voltaireDrep) => voltaireDrep.voter_id === drep.view,
      );
      return {
        ...drep,
        ...voltaireDrep,
      };
    });
    return mergedDreps;
  }
  async getSingleDrepViaID(drepId: number) {
    const drep = await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect(
        'attachment',
        'attachment',
        'attachment.parentEntity = :parentEntity AND attachment.parentId = drep.id',
        { parentEntity: 'drep' },
      )
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('drep.id = :drepId', { drepId })
      .getRawMany();
    let drepVoterId;
    if (drep.length > 0) drepVoterId = drep[0].signature_drepVoterId;
    const drepCexplorer = await this.getDrepCexplorerDetails(drepVoterId);
    const drepVotingHistory = await this.getDrepVotingActivity(drepVoterId);
    const drepDelegators =
      await this.getDrepDelegatorsWithVotingPower(drepVoterId);
    const combinedResult = {
      ...drep[0],
      cexplorerDetails: drepCexplorer,
      activity: drepVotingHistory,
      delegators: drepDelegators,
    };
    if (
      (!drep || drep.length === 0) &&
      (!drepCexplorer || drepCexplorer.length === 0)
    ) {
      throw new NotFoundException('Drep not found!');
    }
    if (combinedResult.attachment_url) {
      combinedResult.attachment_url =
        await this.attachmentService.parseBufferToBase64(
          combinedResult.attachment_url,
          combinedResult.attachemnt_attachmentType,
        );
    }

    return combinedResult;
  }
  async getSingleDrepViaVoterID(drepVoterId: string) {
    const drep = await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect(
        'attachment',
        'attachment',
        'attachment.parentEntity = :parentEntity AND attachment.parentId = drep.id',
        { parentEntity: 'drep' },
      )
      .leftJoinAndSelect('signature', 'signature', 'signature.drepId = drep.id')
      .where('signature.drepVoterId = :drepVoterId', { drepVoterId })
      .getRawMany();
    const drepCexplorer = await this.getDrepCexplorerDetails(drepVoterId);
    const drepVotingHistory = await this.getDrepVotingActivity(drepVoterId);
    const drepDelegators =
      await this.getDrepDelegatorsWithVotingPower(drepVoterId);
    const combinedResult = {
      ...drep[0],
      cexplorerDetails: drepCexplorer,
      activity: drepVotingHistory,
      delegators: drepDelegators,
    };
    if (
      (!drep || drep.length === 0) &&
      (!drepCexplorer || drepCexplorer.length === 0)
    ) {
      throw new NotFoundException('Drep not found!');
    }
    if (combinedResult.attachment_url) {
      combinedResult.attachment_url =
        await this.attachmentService.parseBufferToBase64(
          combinedResult.attachment_url,
          combinedResult.attachemnt_attachmentType,
        );
    }

    return combinedResult;
  }
  async getDrepCexplorerDetails(drepVoterId: string) {
    //also get his details from cexplorer
    const viewParam = drepVoterId;
    const drepCexplorer = await this.cexplorerService.manager.query(
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
                  va.url, 
                  reg_tx_bk.time AS date_of_registration,
                  reg_tx_bk.epoch_no AS epoch_of_registration,
                  va.data_hash, 
                  va.type,
                  sa.view AS stake_address,
                  (
                    SELECT COUNT(DISTINCT dv.addr_id)
                    FROM delegation_vote dv
                    WHERE dv.drep_hash_id = dh.id
                  ) AS delegation_vote_count,
                  ROW_NUMBER() OVER (PARTITION BY dh.id ORDER BY dd.epoch_no DESC) AS RowNum
              FROM 
                  drep_hash AS dh
              LEFT JOIN 
                  drep_distr AS dd ON dh.id = dd.hash_id
              LEFT JOIN 
                  drep_registration AS dr ON dh.id = dr.drep_hash_id
              LEFT JOIN 
                  voting_anchor AS va ON dr.voting_anchor_id = va.id
              LEFT JOIN 
                  delegation_vote AS dv ON dh.id = dv.drep_hash_id 
              LEFT JOIN 
                  tx AS reg_tx ON dr.tx_id = reg_tx.id 
              LEFT JOIN 
                  block AS reg_tx_bk ON reg_tx.block_id = reg_tx_bk.id 
              LEFT JOIN
                  stake_address AS sa ON dv.addr_id = sa.id 
              WHERE 
                  dh.view = $1
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
              date_of_registration,
              epoch_of_registration,
              url,
              type
          FROM 
              RankedRows
          WHERE 
              RowNum = 1`,
      [viewParam],
    );
    return drepCexplorer[0];
  }
  async getDrepVotingActivity(drepVoterId: string) {
    const viewParam = drepVoterId;
    const drepVotingHistory = (await this.cexplorerService.manager.query(
      `SELECT  
          dh.view, 
          encode(prop_creation_tx.hash, 'hex') AS gov_action_proposal_id,
          prop_creation_bk.time AS prop_inception,
          gp.description,
          vp.vote,
          bk.time AS time_voted,
          prop_creation_bk.epoch_no AS proposal_epoch,
          bk.epoch_no AS voting_epoch
      FROM 
          drep_hash AS dh
      JOIN 
          voting_procedure AS vp ON dh.id = vp.drep_voter
      LEFT JOIN 
          gov_action_proposal AS gp ON vp.gov_action_proposal_id = gp.id
      LEFT JOIN 
          tx AS tx ON vp.tx_id = tx.id
      LEFT JOIN 
          tx AS prop_creation_tx ON gp.tx_id = prop_creation_tx.id
      LEFT JOIN 
          block AS bk ON tx.block_id = bk.id 
      LEFT JOIN 
          block AS prop_creation_bk ON prop_creation_tx.block_id = prop_creation_bk.id
      WHERE
          dh.view = $1
      ORDER BY 
          bk.epoch_no;`,
      [viewParam],
    )) as any[];
    return drepVotingHistory.map((item) => {
      return {
        ...item,
        gov_action_proposal_id: item.gov_action_proposal_id,
      };
    });
  }

  async populateFakeDRepData() {
    const dreps = await this.getAllDrepsCexplorer();
    //seeding`
    const modified = dreps.map((drep) => {
      return {
        ...drep,
        name: faker.person.fullName(),
        bio: faker.lorem.sentences(2),
      };
    });
    await this.voltaireService.getRepository('Drep').insert(modified);
    return modified;
  }
  async registerDrep(drepDto: createDrepDto, profileUrl: Express.Multer.File) {
    const insertedDrep = await this.voltaireService
      .getRepository('Drep')
      .insert(drepDto);
    if (profileUrl) {
      const optimizedProfileImageUrl =
        await this.attachmentService.parseImageSize(
          profileUrl.buffer,
          profileUrl.mimetype,
        );
      await this.attachmentService.insertAttachment(
        optimizedProfileImageUrl,
        profileUrl.mimetype,
        insertedDrep.identifiers[0].id,
      );
    }
    const signatureDto = {
      drep: insertedDrep.identifiers[0].id,
      drepVoterId: drepDto?.voter_id,
      drepStakeKey: drepDto?.stake_addr,
    };
    const insertedSig = await this.voltaireService
      .getRepository('Signature')
      .insert(signatureDto);
    return { insertedDrep, insertedSig };
  }
  async getEpochParams() {
    try {
      const APIURL =
        'https://cardano-sanchonet.blockfrost.io/api/v0/epochs/latest/parameters';
      const response = await axios.get(APIURL, {
        headers: {
          project_id: this.configService.get<string>(
            'BLOCKFROST_SANCHONET_PROJECT_ID',
          ),
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  async getDrepDelegatorsWithVotingPower(drepVoterId: string) {
    // Step 1: Get the delegators and their delegation epoch
    const drepDelegators = await this.cexplorerService.manager.query(
      `SELECT 
          sa.view AS stake_address,
          b.epoch_no AS delegation_epoch
       FROM 
          drep_hash AS dh
       JOIN 
          delegation_vote AS dv ON dh.id = dv.drep_hash_id
       JOIN 
          stake_address sa ON dv.addr_id = sa.id
       JOIN 
          tx ON dv.tx_id = tx.id
       JOIN 
          block b ON tx.block_id = b.id
       WHERE 
          dh.view = $1`,
      [drepVoterId],
    );

    // Step 2: Remove duplicates and keep track of delegation epochs
    const uniqueDelegatorsMap = new Map<string, number>();
    drepDelegators.forEach((delegator) => {
      uniqueDelegatorsMap.set(
        delegator.stake_address,
        delegator.delegation_epoch,
      );
    });

    // Step 3: Calculate voting power for each unique delegator
    const delegatorsWithVotingPower = await Promise.all(
      Array.from(uniqueDelegatorsMap).map(
        async ([stakeAddress, delegationEpoch]) => {
          const votingPowerResult = await this.cexplorerService.manager.query(
            `SELECT 
            SUM(uv.value) AS total_stake
         FROM 
            utxo_view uv
         JOIN 
            stake_address sa ON uv.stake_address_id = sa.id
         WHERE 
            sa.view = $1
         GROUP BY 
            sa.view;`,
            [stakeAddress],
          );

          let totalStakeInAda = 0;
          if (votingPowerResult.length > 0) {
            const totalStakeInLovelace = parseInt(
              votingPowerResult[0].total_stake,
              10,
            );
            totalStakeInAda = totalStakeInLovelace / 1000000;
          }

          return {
            stakeAddress,
            delegationEpoch,
            votingPower: totalStakeInAda,
          };
        },
      ),
    );
    //sort from highest epoch
    delegatorsWithVotingPower.sort(
      (a, b) => b.delegationEpoch - a.delegationEpoch,
    );

    return delegatorsWithVotingPower;
  }

  async updateDrepInfo(
    drepId: number,
    drep: createDrepDto,
    profileUrl: Express.Multer.File,
  ) {
    const foundDrep = await this.voltaireService
      .getRepository('Drep')
      .createQueryBuilder('drep')
      .leftJoinAndSelect(
        'attachment',
        'attachment',
        'attachment.parentEntity = :parentEntity AND attachment.parentId = drep.id',
        { parentEntity: 'drep' },
      )
      .where('drep.id = :drepId', { drepId })
      .getRawMany();

    if (!foundDrep) {
      throw new NotFoundException('Drep to be updated not found!');
    }
    if (profileUrl) {
      const optimizedProfileImageBuffer =
        await this.attachmentService.parseImageSize(
          profileUrl.buffer,
          profileUrl.mimetype,
        );
      await this.attachmentService.updateAttachment(
        optimizedProfileImageBuffer,
        foundDrep[0].attachment_id,
        profileUrl.mimetype,
        drepId,
      );
    }
    if (drep.signature) {
      await this.voltaireService
        .getRepository('Signature')
        .update(
          { drep: foundDrep[0].drep_id },
          { drepSignatureKey: drep.key, drepSignature: drep.signature },
        );
      delete drep.signature;
      delete drep.key;
      delete drep.stake_addr;
      delete drep.voter_id;
    }
    const updatedDrep = Object.keys(drep).reduce((acc, key) => {
      let value = drep[key];
      try {
        value = JSON.parse(value);
      } catch (e) {
        // ignore
      }
      return { ...acc, [key]: value };
    }, {});
    delete updatedDrep['profileUrl'];
    return await this.voltaireService
      .getRepository('Drep')
      .update(drepId, updatedDrep);
  }
}
