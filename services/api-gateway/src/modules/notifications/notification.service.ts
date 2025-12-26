import {
  Injectable,
  Logger,
  BadRequestException,
  GatewayTimeoutException,
  OnModuleInit,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  CreateNotificationDto,
  IdedNotification,
  NotificationStatusResponseDto,
} from 'src/dto/notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  private readonly INCOMING_CHANNEL =
    process.env.INCOMING_CHANNEL || 'notifications.incoming';

  private readonly STATUS_QUERY_CHANNEL =
    process.env.STATUS_QUERY_CHANNEL || 'notifications.status.query';

  private readonly STATUS_RESPONSE_CHANNEL =
    process.env.STATUS_RESPONSE_CHANNEL || 'notifications.status.response';

  private readonly QUERY_TIMEOUT_MS = parseInt(
    process.env.QUERY_TIMEOUT_MS || '5000',
    10,
  );

  private pendingQueries = new Map<
    string,
    { resolve: (value: any) => void; reject: (error: Error) => void }
  >();

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    this.initializeStatusResponseListener();
  }

  private initializeStatusResponseListener(): void {
    const subscriber = this.redisService.getSubscriber();
    subscriber
      .subscribe(this.STATUS_RESPONSE_CHANNEL)
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to subscribe to status response channel: ${errorMessage}`,
        );
      });

    subscriber.on('message', (channel, message) => {
      if (channel === this.STATUS_RESPONSE_CHANNEL) {
        try {
          const response = JSON.parse(message);
          const { correlationId } = response;

          if (this.pendingQueries.has(correlationId)) {
            const { resolve } = this.pendingQueries.get(correlationId)!;
            this.pendingQueries.delete(correlationId);
            resolve(response);
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to parse status response: ${errorMessage}`);
        }
      }
    });
  }

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

  async getNotificationStatus(
    notificationId: string,
  ): Promise<NotificationStatusResponseDto> {
    if (!notificationId || notificationId.trim() === '') {
      throw new BadRequestException('notificationId is required');
    }

    const correlationId = uuidv4();
    const publisher = this.redisService.getPublisher();

    return new Promise<NotificationStatusResponseDto>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingQueries.delete(correlationId);
        reject(
          new GatewayTimeoutException(
            `Status query for notification ${notificationId} timed out after ${this.QUERY_TIMEOUT_MS}ms`,
          ),
        );
      }, this.QUERY_TIMEOUT_MS);

      this.pendingQueries.set(correlationId, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const query = {
        correlationId,
        notificationId,
      };

      publisher
        .publish(this.STATUS_QUERY_CHANNEL, JSON.stringify(query))
        .catch((error: unknown) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.pendingQueries.delete(correlationId);
          clearTimeout(timeout);
          reject(new Error(`Failed to publish status query: ${errorMessage}`));
        });
    });
  }
}
