import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comment.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CommentRepository extends Repository<Comment> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Comment, dataSource.createEntityManager());
  }

  async createComment(comment: Partial<Comment>): Promise<Comment> {
    const newComment = this.create(comment);
    return this.save(newComment);
  }

  async findById(id: number) {
    return this.findOne({ where: { id } });
  }

  async findByParent(parentId: number, parentEntity: string) {
    return this.createQueryBuilder('comment')
      .where('comment.parentId = :parentId', { parentId })
      .andWhere('comment.parentEntity = :parentEntity', { parentEntity })
      .getMany();
  }

  async findSpecificComment(
    parentId: number,
    parentEntity: string,
    comment: string,
    voter: string,
  ) {
    return this.createQueryBuilder('comment')
      .where('comment.parentId = :parentId', { parentId })
      .andWhere('comment.parentEntity = :parentEntity', { parentEntity })
      .andWhere('comment.comment = :comment', { comment })
      .andWhere('comment.voter = :voter', { voter })
      .getOne();
  }
}
