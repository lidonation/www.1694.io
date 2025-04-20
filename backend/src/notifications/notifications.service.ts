import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { VotingActivityHistory } from 'src/common/types';
import { createNotificationDto } from 'src/dto/createNotificationDto';
import { Signature } from 'src/entities/signatures.entity';
import { getCurrentDelegationQuery } from 'src/queries/currentDelegation';
import { getDrepVotingActivityInTimestampQuery } from 'src/queries/drepVotingActivity';
import { DataSource, In } from 'typeorm';
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
    @InjectDataSource('default')
    private voltaireService: DataSource,
    @InjectDataSource('dbsync')
    private cexplorerService: DataSource,
  ) {}

  async getNotifications(ownerId: string) {
    const notifications = await this.voltaireService
      .getRepository('Notification')
      .createQueryBuilder('notification')
      .where('notification.recipient = :ownerId', { ownerId })
      .getMany();
    //sort by date(latest) and isRead
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
    //first check if the owner exists
    const owner = await this.voltaireService
      .getRepository('Signature')
      .findOne({ where: { id: ownerId } });
    if (!owner) {
      throw new HttpException('Owner not found', HttpStatus.NOT_FOUND);
    }
    const notification = this.voltaireService
      .getRepository('Notification')
      .create({
        ...content,
        createdAt: creationTime || new Date(),
        recipient: Number(ownerId),
      });
    await this.voltaireService.getRepository('Notification').save(notification);
    return notification;
  }
  async markNotificationAsRead(notificationId: string) {
    const notification = await this.voltaireService
      .getRepository('Notification')
      .findOne({ where: { id: notificationId } });
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    notification.isRead = true;
    return await this.voltaireService
      .getRepository('Notification')
      .save(notification);
  }

  async markNotificationAsUnread(notificationId: string) {
    const notification = await this.voltaireService
      .getRepository('Notification')
      .findOne({ where: { id: notificationId } });
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    notification.isRead = false;
    return await this.voltaireService
      .getRepository('Notification')
      .save(notification);
  }

  async deleteNotification(notificationId: string) {
    const notification = await this.voltaireService
      .getRepository('Notification')
      .findOne({ where: { id: notificationId } });
    if (!notification) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    return await this.voltaireService
      .getRepository('Notification')
      .delete(notification);
  }
  async bulkDeleteNotifications(notificationIds: string[]) {
    const notifications = await this.voltaireService
      .getRepository('Notification')
      .findBy({ id: In(notificationIds) });
    if (!notifications) {
      throw new HttpException('Notifications not found', HttpStatus.NOT_FOUND);
    }
    return await this.voltaireService
      .getRepository('Notification')
      .delete(notifications);
  }
  async processEntityVoteNotifications(
    signature: Signature,
    lastSyncTime: Date,
  ) {
    try {
      //get all the events since the last signin
      const timeSinceLastSync = lastSyncTime || signature.lastSignedIn;
      //note_creation by drep delegated to
      const delegatedTo = (await this.cexplorerService.query(
        getCurrentDelegationQuery,
        [signature.stakeKey],
      )) as [{ drep_view: string }];
      const votingActivity = (await this.cexplorerService.manager.query(
        getDrepVotingActivityInTimestampQuery,
        [delegatedTo[0].drep_view, timeSinceLastSync, new Date()],
      )) as VotingActivityHistory[];
      for (const vote of votingActivity) {
        //check if voter is the recipient, skip if so
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
    //get all the delegators of the drep
    const drep = await this.cexplorerService.query(
      `SELECT id, view FROM drep_hash WHERE view = $1`,
      [drepId],
    );
    const delegators = (await this.cexplorerService.query(
      ` SELECT DISTINCT sa.view FROM delegation_vote as dv
        JOIN stake_address as sa on sa.id = dv.addr_id
        WHERE drep_hash_id = $1`,
      [drep[0].id],
    )) as [{ view: string }];
    for (const delegator of delegators) {
      //check those who have ever signed in
      const signature = await this.voltaireService
        .getRepository('Signature')
        .findOne({ where: { stakeKey: delegator.view } });
      if (!signature || signature?.voterId === drepId) {
        continue;
      }
      //check if delegator has signed in recently ( 2wks)
      if (
        new Date(signature.lastSignedIn).getTime() <
        note_creation_date.getTime() - 14 * 24 * 60 * 60 * 1000
      ) {
        //Delegator has not signed in recently. Skipping to save resources
        continue;
      }
      //send notification to each delegator
      const notificationContent = this.newNoteNotification(
        note_creation_date.getTime(),
        drepId,
      );
      await this.createNotification(notificationContent, signature.id);
    }
    return 'Done';
  }
  // Notification templates
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
    drepId:string,
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
  //will purge notifications older than 90 days and process vote notifications every hour
  @Cron(CronExpression.EVERY_HOUR)
  private async notificationProcessAndPurge() {
    const synctime = await this.voltaireService
      .getRepository('Synctime')
      .find();
    //get all signatures
    const signatures = await this.voltaireService
      .getRepository('Signature')
      .find({});
    if (signatures) {
      for (const sig of signatures) {
        //check if the signer sign in is less than 2 wks old
        if (
          new Date(sig.lastSignedIn).getTime() <
          new Date().getTime() - 14 * 24 * 60 * 60 * 1000
        ) {
          //skip to save resources. unwise to notify inactive users
          continue;
        }
        await this.processEntityVoteNotifications(
          sig as Signature,
          synctime[0]?.lastSyncTime,
        );
      }
    }
    //get notifications
    const notifications = await this.voltaireService
      .getRepository('Notification')
      .find({});
    if (notifications) {
      const oldNotifs = notifications.filter((notification) => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return notification.createdAt < ninetyDaysAgo;
      });
      if (oldNotifs.length > 0) {
        await this.bulkDeleteNotifications(oldNotifs.map((notif) => notif.id));
        console.log(`${oldNotifs.length} notifications purged`);
      }
    }
    if (!synctime || synctime?.length === 0) {
      await this.voltaireService
        .getRepository('Synctime')
        .insert({ lastSyncTime: new Date() });
    } else
      await this.voltaireService
        .getRepository('Synctime')
        .update(synctime[0]?.id, { lastSyncTime: new Date() });
  }
}
