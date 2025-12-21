import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DispatcherService implements OnModuleInit {
  private readonly logger = new Logger(DispatcherService.name);

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    const subscriber = this.redisService.getSubscriber();

    await subscriber.subscribe('notifications.incoming');
    this.logger.log('Subscribed to notifications.incoming');

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

  private async handleMessage(channel: string, message: string): Promise<void> {
    this.logger.log(`Received event on ${channel}: ${message}`);

    const publisher = this.redisService.getPublisher();

    await publisher.publish('notifications.dispatch', message);

    this.logger.log('Event dispatched to notifications.dispatch');
  }
}
