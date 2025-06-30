import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ReactionRepository } from 'src/repository/voltaire/reactions.repository';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';
import { NoteRepository } from 'src/repository/voltaire/note.repository';
import { CommentRepository } from 'src/repository/voltaire/comment.repository';
import {
  ReactionParentEntityType,
  ReactionTypeName,
} from 'src/entities/reaction.entity';

@Injectable()
export class ReactionsService {
  constructor(
    private readonly reactionsRepository: ReactionRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly noteRepository: NoteRepository,
    private readonly commentRepository: CommentRepository,
    private notificationsService: NotificationsService,
  ) {}

  async getReactions(parentId: number, parentEntity: string) {
    return this.reactionsRepository.findByParent(parentId, parentEntity);
  }

  async insertReaction(
    parentId: number,
    parentEntity: string,
    type: string,
    voter: string,
  ) {
    const createdRxn = await this.reactionsRepository.createReaction({
      parentId,
      parentEntity: parentEntity as ReactionParentEntityType,
      type: type as ReactionTypeName,
      voter,
    });
    5;

    await this.handleReactionNotification(
      createdRxn,
      parentId,
      parentEntity,
      voter,
    );

    return createdRxn;
  }

  async removeReaction(
    parentId: number,
    parentEntity: string,
    type: string,
    voter: string,
  ) {
    const reaction = await this.reactionsRepository.findSpecificReaction(
      parentId,
      parentEntity,
      type,
      voter,
    );

    if (reaction) {
      return this.reactionsRepository.delete(reaction.id);
    }
  }

  private async handleReactionNotification(
    reaction: any,
    parentId: number,
    parentEntity: string,
    voter: string,
  ) {
    let parent;
    let content;

    switch (parentEntity) {
      case 'note':
        parent = await this.noteRepository.findWithAuthor(parentId);

        if (voter !== parent.author?.stakeKey) {
          content = this.notificationsService.newReactionToNoteNotification(
            reaction.type as any,
            voter,
            parent?.author?.voterId,
            new Date(parent?.createdAt).getTime(),
          );
          await this.notificationsService.createNotification(
            content,
            parent.author?.id,
          );
        }
        break;

      case 'comment':
        parent = await this.commentRepository.findById(parentId);

        if (voter !== parent.voter) {
          content = this.notificationsService.newReactionForCommentNotification(
            reaction.type as any,
            voter,
          );

          const signature = await this.signatureRepository.findByStakeKey(
            parent.voter,
          );
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
  }
}
