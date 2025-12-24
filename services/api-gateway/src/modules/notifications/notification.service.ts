import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CreateNotificationDto } from 'src/dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly INCOMING_CHANNEL =
    process.env.INCOMING_CHANNEL || 'notifications.incoming';

  constructor(private readonly redisService: RedisService) {}

  async handleNotification(notification: CreateNotificationDto) {
    await this.push(this.INCOMING_CHANNEL, notification);
  }

  async push(channel: string, notification: CreateNotificationDto) {
    const publisher = this.redisService.getPublisher();
    await publisher.publish(channel, JSON.stringify(notification));
  }
}
