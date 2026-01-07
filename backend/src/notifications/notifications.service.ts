import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createNotificationDto } from 'src/dto/createNotificationDto';
import { Signature } from 'src/entities/signatures.entity';
import { NotificationRepository } from 'src/repository/voltaire/notifications.repository';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';
import { SynctimeRepository } from 'src/repository/voltaire/synctime.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
    @InjectDataSource('default')
    private readonly voltaireDb: DataSource,
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
      // Get all the events since the last sync
      const timeSinceLastSync = lastSyncTime || signature.lastSignedIn;

      // Get current delegation for the user
      const delegationData = await this.voltaireDb.query(
        `SELECT dd.drep_id, d.given_name
         FROM drep_delegators dd
         LEFT JOIN dreps d ON d.drep_id = dd.drep_id
         WHERE dd.stake_address = $1
         ORDER BY dd.updated_at DESC
         LIMIT 1`,
        [signature.stakeKey]
      );

      if (!delegationData || delegationData.length === 0) {
        // console.log('No delegation found for user');
        return 'Done';
      }

      const delegatedTo = delegationData[0];
      
      // Get voting activity for the delegated DRep since last sync
      const votingActivity = await this.voltaireDb.query(
        `SELECT pv.*, p.title, p.type, p.created_at as proposal_created_at
         FROM proposal_votes pv
         LEFT JOIN proposals p ON p.id = pv.proposal_id
         WHERE pv.voter = $1 AND pv.created_at > $2
         ORDER BY pv.created_at DESC`,
        [delegatedTo.drep_id, timeSinceLastSync]
      );

      for (const vote of votingActivity) {
        // Check if voter is the recipient, skip if so
        if (signature.voterId === vote.voter) {
          continue;
        }

        const timeVoted = new Date(vote.created_at).getTime();
        const notificationContent = this.newVoteOnProposalNotification(
          timeVoted,
          delegatedTo.drep_id,
          vote.vote
        );

        await this.createNotification(
          notificationContent,
          signature.id,
          vote.created_at,
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
    // Use enhanced delegators table
    try {
      const delegators = await this.voltaireDb.query(
        'SELECT stake_address FROM drep_delegators WHERE drep_id = $1',
        [drepId]
      );

      for (const delegator of delegators) {
        // Check those who have ever signed in
        const signature = await this.signatureRepository.findByStakeKey(
          delegator.stake_address,
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
    } catch (error) {
      console.log('Error processing note notifications:', error);
      return 'Done';
    }
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
      // console.log(`${oldNotifications.length} notifications purged`);
    }

    // Update sync time
    await this.synctimeRepository.updateSyncTime(new Date());
  }
}
