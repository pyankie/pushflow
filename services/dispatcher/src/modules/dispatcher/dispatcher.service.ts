import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../mongo/notification.service';
import { INotification } from '../mongo/notification.schema';

@Injectable()
export class DispatcherService implements OnModuleInit {
  private readonly logger = new Logger(DispatcherService.name);

  private readonly INCOMING_CHANNEL = 'notifications.incoming';
  private readonly DISPATCH_CHANNEL = 'notifications.dispatch';

  private readonly ACK_CHANNEL = process.env.ACK_CHANNEL || 'notifications.ack';

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    const subscriber = this.redisService.getSubscriber();

    await subscriber.subscribe(this.INCOMING_CHANNEL);
    await subscriber.subscribe(this.ACK_CHANNEL);
    this.logger.log(
      `Subscribed to ${this.INCOMING_CHANNEL}, ${this.ACK_CHANNEL}, ${this.STATUS_QUERY_CHANNEL}`,
    );

    subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message).catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to handle message on ${channel}: ${errorMessage}`,
        );
      });
    });
  }

  private async handleMessage(
    channel: string,
    rawMessage: string,
  ): Promise<void> {
    this.logger.log(`Received event on ${channel}: ${rawMessage}`);

    let message: Partial<INotification>;
    try {
      message = JSON.parse(rawMessage) as INotification;
    } catch (error) {
      this.logger.error(
        `Failed to parse message: ${rawMessage}. \n error: ${error}`,
      );
      return;
    }

    // required fields
    if (
      !message.notificationId ||
      !message.receiverId ||
      !message.senderId ||
      !message.payload
    ) {
      this.logger.error(`Invalid message format: ${JSON.stringify(message)}`);
      return;
    }

    const enhancedMessage: INotification = {
      notificationId: message.notificationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      payload: message.payload,
      metadata: message.metadata,
      status: 'pending',
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
    };

    const publisher = this.redisService.getPublisher();

    // (blocking - critical path)
    await publisher.publish(
      this.DISPATCH_CHANNEL,
      JSON.stringify(enhancedMessage),
    );

    // (non-blocking, fire-and-forget)
    this.notificationService.saveNotificationAsync(enhancedMessage);

    this.logger.log(
      `Event ${enhancedMessage.notificationId} enriched with status='pending' and dispatched to ${this.DISPATCH_CHANNEL}`,
    );
  }

  private async handleAcknowledgment(notificationId: string): Promise<void> {
    this.logger.log(
      `Received acknowledgment for notification: ${notificationId}`,
    );

    try {
      await this.notificationService.updateNotificationStatus(
        notificationId,
        'delivered',
      );
      this.logger.log(
        `Updated notification ${notificationId} status to 'delivered'`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update notification status: ${errorMessage}`,
      );
    }
  }

  private async handleStatusQuery(rawMessage: string): Promise<void> {
    let query: { correlationId: string; notificationId: string };
    try {
      query = JSON.parse(rawMessage);
    } catch (error) {
      this.logger.error(`Failed to parse status query: ${rawMessage}`);
      return;
    }

    const { correlationId, notificationId } = query;

    try {
      const notification =
        await this.notificationService.getNotificationById(notificationId);

      if (!notification) {
        this.logger.warn(`Notification not found: ${notificationId}`);
        return;
      }

      const response = {
        correlationId,
        notificationId: notification.notificationId,
        status: notification.status,
        timestamp: notification.timestamp.toISOString(),
      };

      const publisher = this.redisService.getPublisher();
      await publisher.publish(
        this.STATUS_RESPONSE_CHANNEL,
        JSON.stringify(response),
      );

      this.logger.log(
        `Sent status response for notification ${notificationId}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to handle status query for ${notificationId}: ${errorMessage}`,
      );
    }
  }
}
