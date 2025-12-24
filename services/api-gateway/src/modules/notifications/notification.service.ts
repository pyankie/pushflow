import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { IdedNotification, Notification } from 'src/dto/notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly INCOMING_CHANNEL =
    process.env.INCOMING_CHANNEL || 'notifications.incoming';

  constructor(private readonly redisService: RedisService) {}

  async handleNotification(notification: Notification) {
    const IdedNotification: IdedNotification = {
      ...notification,
      notificationId: uuidv4(),
    };

    await this.push(this.INCOMING_CHANNEL, IdedNotification);
  }

  async push(channel: string, notification: IdedNotification) {
    const publisher = this.redisService.getPublisher();
    await publisher.publish(channel, JSON.stringify(notification));
  }
}
