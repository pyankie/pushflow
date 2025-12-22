import { Inject, Injectable, Logger } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { NotificationSchema, INotification } from './notification.schema';

@Injectable()
export class NotificationService {
  private readonly notificationModel: Model<INotification>;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('MONGO_CONNECTION') private readonly mongoConnection: Connection,
  ) {
    this.notificationModel = this.mongoConnection.model<INotification>(
      'Notification',
      NotificationSchema,
    );
  }

  getNotificationModel(): Model<INotification> {
    return this.notificationModel;
  }
}
