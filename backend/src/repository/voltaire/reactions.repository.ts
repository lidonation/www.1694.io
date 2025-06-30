import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Reaction } from 'src/entities/reaction.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ReactionRepository extends Repository<Reaction> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Reaction, dataSource.createEntityManager());
  }

  async createReaction(reaction: Partial<Reaction>): Promise<Reaction> {
    const newReaction = this.create(reaction);
    return this.save(newReaction);
  }

  async findByParent(parentId: number, parentEntity: string) {
    return this.createQueryBuilder('reaction')
      .where('reaction.parentId = :parentId', { parentId })
      .andWhere('reaction.parentEntity = :parentEntity', { parentEntity })
      .getMany();
  }

  async findSpecificReaction(
    parentId: number,
    parentEntity: string,
    type: string,
    voter: string,
  ) {
    return this.createQueryBuilder('reaction')
      .where('reaction.parentId = :parentId', { parentId })
      .andWhere('reaction.parentEntity = :parentEntity', { parentEntity })
      .andWhere('reaction.type = :type', { type })
      .andWhere('reaction.voter = :voter', { voter })
      .getOne();
  }
}
