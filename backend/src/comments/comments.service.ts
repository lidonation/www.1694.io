import { Injectable } from '@nestjs/common';
import { CommentParentEntityType } from 'src/entities/comment.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ReactionsService } from 'src/reactions/reactions.service';
import { CommentRepository } from 'src/repository/voltaire/comment.repository';
import { NoteRepository } from 'src/repository/voltaire/note.repository';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly noteRepository: NoteRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly reactionsService: ReactionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getComments(parentId: number, parentEntity: string) {
    const comments = await this.commentRepository.findByParent(
      parentId,
      parentEntity,
    );

    for (const comment of comments) {
      comment.reactions = await this.reactionsService.getReactions(
        comment.id,
        'comment',
      );
      comment['comments'] = await this.getComments(comment.id, 'comment');
    }

    // Sort by creation date (newest first)
    const sortedComments = comments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return sortedComments;
  }

  async insertComment(
    parentId: number,
    parentEntity: string,
    comment: string,
    voter: string,
    rootEntity: string,
    rootEntityId: number,
  ) {
    // Create the comment
    const savedComment = await this.commentRepository.createComment({
      parentId,
      parentEntity: parentEntity as CommentParentEntityType,
      content: comment,
      voter,
    });

    // Update root note's updatedAt if applicable
    if (rootEntity === 'note') {
      await this.noteRepository.updateTimestamp(rootEntityId);
    }

    // Handle notifications based on parent entity
    await this.handleCommentNotification(
      savedComment,
      parentId,
      parentEntity,
      voter,
    );

    return savedComment;
  }

  async removeComment(
    parentId: number,
    parentEntity: string,
    comment: string,
    voter: string,
  ) {
    const commentToRemove = await this.commentRepository.findSpecificComment(
      parentId,
      parentEntity,
      comment,
      voter,
    );

    if (commentToRemove) {
      return this.commentRepository.delete(commentToRemove.id);
    }
  }

  private async handleCommentNotification(
    savedComment: any,
    parentId: number,
    parentEntity: string,
    voter: string,
  ) {
    switch (parentEntity) {
      case 'note':
        await this.handleNoteCommentNotification(savedComment, parentId, voter);
        break;
      case 'comment':
        await this.handleReplyNotification(savedComment, parentId, voter);
        break;
      default:
        break;
    }
  }

  private async handleNoteCommentNotification(
    savedComment: any,
    noteId: number,
    voter: string,
  ) {
    const note = await this.noteRepository.findWithAuthor(noteId);

    if (note && voter !== note?.author?.stakeKey) {
      const notificationContent =
        this.notificationsService.newCommentOnNoteNotification(
          new Date(note?.createdAt as Date).getTime(),
          note?.author?.voterId,
          voter,
        );

      await this.notificationsService.createNotification(
        notificationContent,
        note.author?.id,
      );
    }
  }

  private async handleReplyNotification(
    savedComment: any,
    parentCommentId: number,
    voter: string,
  ) {
    const parentComment =
      await this.commentRepository.findById(parentCommentId);

    if (parentComment && parentComment.voter !== voter) {
      const signature = await this.signatureRepository.findByStakeKey(
        parentComment.voter,
      );

      if (signature) {
        const notificationContent =
          this.notificationsService.newReplyToCommentNotification(voter);

        await this.notificationsService.createNotification(
          notificationContent,
          signature.id,
          savedComment.createdAt,
        );
      }
    }
  }
}
