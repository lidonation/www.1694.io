import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Synctime } from 'src/entities/synctime.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class SynctimeRepository extends Repository<Synctime> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Synctime, dataSource.createEntityManager());
  }

  async getLatest() {
    return this.find();
  }

  async updateSyncTime(time: Date) {
    const synctime = await this.find();
    if (!synctime || synctime.length === 0) {
      return this.insert({ lastSyncTime: time.toISOString() });
    } else {
      return this.update(synctime[0].id, { lastSyncTime: time.toISOString() });
    }
  }
}
