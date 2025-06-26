import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Signature } from 'src/entities/signatures.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class SignatureRepository extends Repository<Signature> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Signature, dataSource.createEntityManager());
  }

  async createSignature(signature: Partial<Signature>): Promise<Signature> {
    const newSignature = this.create(signature);
    return this.save(newSignature);
  }

  async findById(id: number) {
    return this.findOne({ where: { id } });
  }

  async findByStakeKey(stakeKey: string) {
    return this.findOne({ where: { stakeKey } });
  }

  async findAll() {
    return this.find();
  }
}
