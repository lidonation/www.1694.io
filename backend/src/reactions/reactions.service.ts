import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource } from 'typeorm';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectDataSource('default')
    private voltaireService: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async getReactions(parentId: number, parentEntity: string) {
    const reactions = await this.voltaireService
      .getRepository('Reaction')
      .createQueryBuilder('reaction')
      .where('reaction.parentId = :parentId', { parentId })
      .andWhere('reaction.parentEntity = :parentEntity', { parentEntity })
      .getMany();
    return reactions;
  }
  async insertReaction(
    parentId: number,
    parentEntity: string,
    type: string,
    voter: string,
  ) {
    const newReaction = this.voltaireService.getRepository('Reaction').create({
      parentId,
      parentEntity,
      type,
      voter,
    });
    const createdRxn = await this.voltaireService
      .getRepository('Reaction')
      .save(newReaction);
    //inform the owner of the reacted to entity
    let parent;
    let content;
    switch (parentEntity) {
      case 'note':
        parent = await this.voltaireService
          .getRepository(parentEntity)
          .createQueryBuilder(parentEntity)
          .leftJoinAndSelect('note.author', 'signature')
          .where('note.id = :parentId', { parentId })
          .getOne();
        if (voter !== parent.author?.stakeKey) {
          content = this.notificationsService.newReactionToNoteNotification(
            createdRxn.type as any,
            voter,
            parent?.author?.voterId,
            new Date(parent?.createdAt).getTime()
          );
          await this.notificationsService.createNotification(
            content,
            parent.author?.id,
          );
        }
        break;
      case 'comment':
        parent = await this.voltaireService
          .getRepository(parentEntity)
          .findOne({ where: { id: parentId } });
        if (voter !== parent.voter) {
          content = this.notificationsService.newReactionForCommentNotification(
            createdRxn.type as any,
            voter,
          );
          const signature = await this.voltaireService
            .getRepository('Signature')
            .findOne({ where: { stakeKey: parent.voter } });
          if (signature) {
            await this.notificationsService.createNotification(
              content,
              signature.id,
            );
          }
        }
        break;
      default:
        break;
    }
    return createdRxn;
  }
  async removeReaction(
    parentId: number,
    parentEntity: string,
    type: string,
    voter: string,
  ) {
    const reaction = await this.voltaireService
      .getRepository('Reaction')
      .createQueryBuilder('reaction')
      .where('reaction.parentId = :parentId', { parentId })
      .andWhere('reaction.parentEntity = :parentEntity', { parentEntity })
      .andWhere('reaction.type = :type', { type })
      .andWhere('reaction.voter = :voter', { voter })
      .getOne();
    return this.voltaireService.getRepository('Reaction').delete(reaction.id);
  }
}
