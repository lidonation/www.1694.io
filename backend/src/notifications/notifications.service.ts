import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createNotificationDto } from 'src/dto/createNotificationDto';
import { Signature } from 'src/entities/signatures.entity';
import { CardanoRepository } from 'src/repository/cardano/cardano.repository';
import { NotificationRepository } from 'src/repository/voltaire/notifications.repository';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';
import { SynctimeRepository } from 'src/repository/voltaire/synctime.repository';

type NotificationEvent = //for reference

    | 'note_creation'
    | 'voting'
    | 'comment_on_note'
    | 'reply_to_comment'
    | 'reaction_to_note'
    | 'reaction_to_comment';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly synctimeRepository: SynctimeRepository,
    private readonly cardanoRepository: CardanoRepository,
  ) {}

  async getNotifications(ownerId: string) {
    const notifications =
      await this.notificationRepository.findByRecipient(ownerId);

    // Sort by date(latest) and isRead
    notifications.sort((a, b) => {
      if (a.isRead && !b.isRead) {
        return 1;
      }
      if (!a.isRead && b.isRead) {
        return -1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return notifications;
  }

  async createNotification(
    content: createNotificationDto,
    ownerId: number,
    creationTime?: Date,
  ) {
    // First check if the owner exists
    const owner = await this.signatureRepository.findById(ownerId);
    if (!owner) {
      throw new HttpException('Owner not found', HttpStatus.NOT_FOUND);
    }

    return this.notificationRepository.createNotification({
      ...content,
      createdAt: creationTime || new Date(),
      recipient: Number(ownerId),
    });
  }

  async markNotificationAsRead(notificationId: string) {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    return this.notificationRepository.markAsRead(notificationId);
  }

  async markNotificationAsUnread(notificationId: string) {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    return this.notificationRepository.markAsUnread(notificationId);
  }

  async deleteNotification(notificationId: string) {
    const notification =
      await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }

    return this.notificationRepository.delete(notificationId);
  }

  async bulkDeleteNotifications(notificationIds: string[]) {
    const notifications =
      await this.notificationRepository.findByIds(notificationIds);
    if (!notifications || notifications.length === 0) {
      throw new HttpException('Notifications not found', HttpStatus.NOT_FOUND);
    }

    return this.notificationRepository.bulkDelete(notificationIds);
  }

  async processEntityVoteNotifications(
    signature: Signature,
    lastSyncTime: Date,
  ) {
    try {
      // Get all the events since the last signin
      const timeSinceLastSync = lastSyncTime || signature.lastSignedIn;

      // Note_creation by drep delegated to
      const delegatedTo = await this.cardanoRepository.getCurrentDelegation(
        signature.stakeKey,
      );
      const votingActivity = await this.cardanoRepository.getDrepVotingActivity(
        delegatedTo[0].drep_view,
        timeSinceLastSync,
        new Date(),
      );

      for (const vote of votingActivity) {
        // Check if voter is the recipient, skip if so
        if (signature.voterId === vote.view) {
          continue;
        }

        const timeVoted = new Date(vote.time_voted).getTime();
        const notificationContent = this.newVoteOnProposalNotification(
          timeVoted,
          delegatedTo[0].drep_view,
          vote.vote,
        );

        await this.createNotification(
          notificationContent,
          signature.id,
          vote.time_voted,
        );
      }
      return 'Done';
    } catch (error) {
      console.log('Error while processing vote notifications', error);
      throw error;
    }
  }

  async processNewNoteNotificationsForDelegators(
    drepId: string,
    note_creation_date: Date,
  ) {
    // Get all the delegators of the drep
    const drep = await this.cardanoRepository.getDrepByView(drepId);
    const delegators = await this.cardanoRepository.getDrepDelegators(
      drep[0].id,
    );

    for (const delegator of delegators) {
      // Check those who have ever signed in
      const signature = await this.signatureRepository.findByStakeKey(
        delegator.view,
      );
      if (!signature || signature?.voterId === drepId) {
        continue;
      }

      // Check if delegator has signed in recently (2wks)
      if (
        new Date(signature.lastSignedIn).getTime() <
        note_creation_date.getTime() - 14 * 24 * 60 * 60 * 1000
      ) {
        // Delegator has not signed in recently. Skipping to save resources
        continue;
      }

      // Send notification to each delegator
      const notificationContent = this.newNoteNotification(
        note_creation_date.getTime(),
        drepId,
      );
      await this.createNotification(notificationContent, signature.id);
    }
    return 'Done';
  }

  // Notification templates (unchanged)
  newNoteNotification(note_creation_date: number, drepId: string) {
    return {
      title: 'New Note',
      message: `The [DRep](/dreps/${drepId}) you have delegated to has created a new note. Check it out [here](/dreps/${drepId}?start=${note_creation_date - 5 * 24 * 60 * 60 * 1000}&end=${note_creation_date})`,
      type: 'info' as 'info',
    };
  }

  newCommentOnNoteNotification(
    note_creation_date: number,
    drepId: string,
    voterId: string,
  ) {
    return {
      title: 'New Comment',
      message: `A [voter](/voters/${voterId}) has commented on your [note](/dreps/${drepId}?start=${note_creation_date - 5 * 24 * 60 * 60 * 1000}&end=${note_creation_date})`,
      type: 'info' as 'info',
    };
  }

  newReplyToCommentNotification(voterId: string) {
    return {
      title: 'New Reply',
      message: `A [voter](/voters/${voterId}) has replied to your comment.`,
      type: 'info' as 'info',
    };
  }

  newReactionToNoteNotification(
    reactionType: 'like' | 'dislike' | 'love' | 'rocket',
    voterId: string,
    drepId: string,
    note_creation_date: number,
  ) {
    const reactionIcons = {
      thumbsup: '👍',
      thumbsdown: '👎',
      like: '❤️',
      rocket: '🚀',
    };
    return {
      title: 'Note Reaction',
      message: `A [voter](/voters/${voterId}) has reacted ${reactionIcons[reactionType]} to your [note](/dreps/${drepId}?start=${note_creation_date - 5 * 24 * 60 * 60 * 1000}&end=${note_creation_date})`,
      type: 'info' as 'info',
    };
  }

  newReactionForCommentNotification(
    reactionType: 'like' | 'dislike' | 'love' | 'rocket',
    voterId: string,
  ) {
    const reactionIcons = {
      thumbsup: '👍',
      thumbsdown: '👎',
      like: '❤️',
      rocket: '🚀',
    };
    return {
      title: 'Comment Reaction',
      message: `A [voter](/voters/${voterId}) has reacted ${reactionIcons[reactionType]} to your comment`,
      type: 'info' as 'info',
    };
  }

  newVoteOnProposalNotification(
    timeVoted: number,
    drepId: string,
    voteType: string,
  ) {
    return {
      title: 'Proposal Vote',
      message: `The [drep](/dreps/${drepId}) you have delegated to has just voted ${voteType} on this [proposal](/dreps/${drepId}?start=${timeVoted - 5 * 24 * 60 * 60 * 1000}&end=${timeVoted}).`,
      type: 'info' as 'info',
    };
  }

  // Will purge notifications older than 90 days and process vote notifications every hour
  @Cron(CronExpression.EVERY_HOUR)
  private async notificationProcessAndPurge() {
    const synctime = await this.synctimeRepository.getLatest();

    // Get all signatures
    const signatures = await this.signatureRepository.findAll();

    if (signatures) {
      for (const sig of signatures) {
        // Check if the signer sign in is less than 2 wks old
        if (
          new Date(sig.lastSignedIn).getTime() <
          new Date().getTime() - 14 * 24 * 60 * 60 * 1000
        ) {
          // Skip to save resources. unwise to notify inactive users
          continue;
        }
        await this.processEntityVoteNotifications(
          sig as Signature,
          new Date(synctime[0]?.lastSyncTime),
        );
      }
    }

    // Get notifications older than 90 days
    const oldNotifications =
      await this.notificationRepository.findOlderThan(90);

    if (oldNotifications.length > 0) {
      await this.bulkDeleteNotifications(
        oldNotifications.map((notif) => notif.id?.toString()),
      );
      console.log(`${oldNotifications.length} notifications purged`);
    }

    // Update sync time
    await this.synctimeRepository.updateSyncTime(new Date());
  }
}
