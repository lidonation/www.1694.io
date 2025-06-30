import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comment.entity';
import { DataSource, Repository } from 'typeorm';
import { ReactionRepository } from './reactions.repository';

@Injectable()
export class CommentRepository extends Repository<Comment> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
    private readonly reactionRepository: ReactionRepository,
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

  async getCommentsWithReactionsAndReplies(
    parentId: number,
    parentEntity: string,
  ) {
    const comments = await this.findByParent(parentId, parentEntity);

    // Process each comment recursively
    for (const comment of comments) {
      // Get reactions for this comment
      comment.reactions = await this.reactionRepository.findByParent(
        comment.id,
        'comment',
      );

      // Get nested comments recursively
      comment['comments'] = await this.getCommentsWithReactionsAndReplies(
        comment.id,
        'comment',
      );
    }

    // Sort by creation date (newest first)
    const sortedComments = comments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return sortedComments;
  }
}
