import { Inject } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { NotificationSchema } from './notification.schema';

export class NotificationService {
  private readonly notificationModel: Model<typeof NotificationSchema>;

  constructor(
    @Inject('MONGO_CONNECTION') private readonly mongoConnection: Connection,
  ) {}

  getNotificationModel(): Model<typeof NotificationSchema> {
    return this.notificationModel;
  }
}
