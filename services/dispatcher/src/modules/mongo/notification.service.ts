import { Inject, Injectable, Logger } from '@nestjs/common'
import { Connection, Model } from 'mongoose'
import { INotification, NotificationSchema } from './notification.schema'

@Injectable()
export class NotificationService {
    private readonly notificationModel: Model<INotification>
    private readonly logger = new Logger(NotificationService.name)

    constructor(
        @Inject('MONGO_CONNECTION')
        private readonly mongoConnection: Connection,
    ) {
        this.notificationModel = this.mongoConnection.model<INotification>(
            'Notification',
            NotificationSchema,
        )
    }

    getNotificationModel(): Model<INotification> {
        return this.notificationModel
    }

    /**
     * Save notification metadata (non-blocking, fire-and-forget).
     * Errors are logged but not thrown.
     */
    saveNotificationAsync(data: Partial<INotification>): void {
        this.notificationModel
            .create(data)
            .then(() =>
                this.logger.log(`Notification ${data.notificationId} saved`),
            )
            .catch((err) =>
                this.logger.error(
                    `Failed to save notification ${data.notificationId}: ${err.message}`,
                ),
            )
    }

    /**
     * Get a notification by ID from the database.
     */
    async getNotificationById(
        notificationId: string,
    ): Promise<INotification | null> {
        try {
            const notification = await this.notificationModel.findOne({
                notificationId,
            })
            return notification
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Failed to fetch notification ${notificationId}: ${errorMessage}`,
            )
            throw error
        }
    }

    /**
     * Update the status of a notification.
     */
    async updateNotificationStatus(
        notificationId: string,
        status: string,
    ): Promise<void> {
        try {
            await this.notificationModel.updateOne(
                { notificationId },
                { status },
            )
            this.logger.log(
                `Updated notification ${notificationId} status to ${status}`,
            )
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Failed to update notification ${notificationId} status: ${errorMessage}`,
            )
            throw error
        }
    }
}
