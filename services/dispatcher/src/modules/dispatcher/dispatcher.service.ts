import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../mongo/notification.service';
import { INotification } from '../mongo/notification.schema';

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
      message = JSON.parse(rawMessage);
    } catch (error) {
      this.logger.error(
        `Failed to parse message: ${rawMessage}. \n error: ${error}`,
      );
      return;
    }

    // Validate required fields
    if (!message.receiverId || !message.senderId || !message.payload) {
      this.logger.error(`Invalid message format: ${JSON.stringify(message)}`);
      return;
    }

    const publisher = this.redisService.getPublisher();

    // Publish to the dispatch channel (blocking - critical path)
    await publisher.publish(this.DISPATCH_CHANNEL, JSON.stringify(message));

    // Save to the database (non-blocking, fire-and-forget)
    this.notificationService.saveNotificationAsync(message);

    this.logger.log(`Event dispatched to ${this.DISPATCH_CHANNEL}`);
  }
}
