import { InjectDataSource } from '@nestjs/typeorm';
import { VotingActivityHistory } from 'src/common/types';
import { getCurrentDelegationQuery } from 'src/queries/currentDelegation';
import { getDrepVotingActivityInTimestampQuery } from 'src/queries/drepVotingActivity';
import { DataSource } from 'typeorm';

export class CardanoRepository {
  constructor(
    @InjectDataSource('dbsync')
    private readonly dataSource: DataSource,
  ) {}

  async query(queryString: string, params?: any[]): Promise<any> {
    const query = this.dataSource.createQueryRunner();
    await query.connect();
    try {
      const result = await query.query(queryString, params);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    } finally {
      await query.release();
    }
  }

  async getCurrentDelegation(stakeKey: string) {
    return this.dataSource.query(getCurrentDelegationQuery, [stakeKey]);
  }

  async getDrepVotingActivity(
    drepView: string,
    startTime: Date,
    endTime: Date,
  ) {
    return this.dataSource.query(getDrepVotingActivityInTimestampQuery, [
      drepView,
      startTime,
      endTime,
    ]) as Promise<VotingActivityHistory[]>;
  }

  async getDrepByView(drepId: string) {
    return this.dataSource.query(
      'SELECT id, view FROM drep_hash WHERE view = $1',
      [drepId],
    );
  }

  async getDrepDelegators(drepHashId: number) {
    return this.dataSource.query(
      `SELECT DISTINCT sa.view FROM delegation_vote as dv
       JOIN stake_address as sa on sa.id = dv.addr_id
       WHERE drep_hash_id = $1`,
      [drepHashId],
    ) as Promise<[{ view: string }]>;
  }
}
