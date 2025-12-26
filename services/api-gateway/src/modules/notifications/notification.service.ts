import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  CreateNotificationDto,
  IdedNotification,
} from 'src/dto/notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly INCOMING_CHANNEL =
    process.env.INCOMING_CHANNEL || 'notifications.incoming';

  constructor(private readonly redisService: RedisService) {}

  async handleNotification(notification: CreateNotificationDto) {
    const enhancedNotification: IdedNotification = {
      ...notification,
      notificationId: uuidv4(),
      timestamp: notification.timestamp || new Date().toISOString(),
    };

    await this.push(this.INCOMING_CHANNEL, enhancedNotification);

    return {
      notificationId: enhancedNotification.notificationId,
      timestamp: enhancedNotification.timestamp,
      status: 'ACCEPTED',
    };
  }

  async push(channel: string, notification: IdedNotification) {
    const publisher = this.redisService.getPublisher();
    await publisher.publish(channel, JSON.stringify(notification));
  }
}
