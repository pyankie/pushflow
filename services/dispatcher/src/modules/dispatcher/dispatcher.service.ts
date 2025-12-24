import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../mongo/notification.service';
import { INotification } from '../mongo/notification.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DispatcherService implements OnModuleInit {
  private readonly logger = new Logger(DispatcherService.name);

  private readonly INCOMING_CHANNEL = 'notifications.incoming';
  private readonly DISPATCH_CHANNEL = 'notifications.dispatch';

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    const subscriber = this.redisService.getSubscriber();

    await subscriber.subscribe(this.INCOMING_CHANNEL);
    this.logger.log(`Subscribed to ${this.INCOMING_CHANNEL}`);

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
      message = JSON.parse(rawMessage) as Partial<INotification>;
    } catch (error) {
      this.logger.error(
        `Failed to parse message: ${rawMessage}. \n error: ${error}`,
      );
      return;
    }

    // required fields
    if (!message.receiverId || !message.senderId || !message.payload) {
      this.logger.error(`Invalid message format: ${JSON.stringify(message)}`);
      return;
    }

    const enhancedMessage: INotification = {
      notificationId: uuidv4(),
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
}
