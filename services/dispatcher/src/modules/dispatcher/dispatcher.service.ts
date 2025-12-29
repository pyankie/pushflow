import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { INotification } from '../mongo/notification.schema'
import { NotificationService } from '../mongo/notification.service'
import { SubscriptionService } from '../mongo/subscription.service'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class DispatcherService implements OnModuleInit {
    private readonly logger = new Logger(DispatcherService.name)

    private readonly INCOMING_CHANNEL =
        process.env.INCOMING_CHANNEL || 'notifications.incoming'

    private readonly DISPATCH_CHANNEL =
        process.env.DISPATCH_CHANNEL || 'notifications.dispatch'

    private readonly ACK_CHANNEL =
        process.env.ACK_CHANNEL || 'notifications.ack'

    private readonly STATUS_QUERY_CHANNEL =
        process.env.STATUS_QUERY_CHANNEL || 'notifications.status.query'

    private readonly STATUS_RESPONSE_CHANNEL =
        process.env.STATUS_RESPONSE_CHANNEL || 'notifications.status.response'

    private readonly TOPIC_SUBSCRIBE_CHANNEL =
        process.env.TOPIC_SUBSCRIBE_CHANNEL || 'topics.subscribe'

    private readonly TOPIC_UNSUBSCRIBE_CHANNEL =
        process.env.TOPIC_UNSUBSCRIBE_CHANNEL || 'topics.unsubscribe'

    private readonly TOPICS_QUERY_CHANNEL =
        process.env.TOPICS_QUERY_CHANNEL || 'topics.query'

    private readonly TOPICS_QUERY_RESPONSE_CHANNEL =
        process.env.TOPICS_QUERY_RESPONSE_CHANNEL || 'topics.query.response'

    constructor(
        private readonly redisService: RedisService,
        private readonly notificationService: NotificationService,
        private readonly subscriptionService: SubscriptionService,
    ) {}

    async onModuleInit() {
        const subscriber = this.redisService.getSubscriber()

        await subscriber.subscribe(this.INCOMING_CHANNEL)
        await subscriber.subscribe(this.ACK_CHANNEL)
        await subscriber.subscribe(this.STATUS_QUERY_CHANNEL)
        await subscriber.subscribe(this.TOPIC_SUBSCRIBE_CHANNEL)
        await subscriber.subscribe(this.TOPIC_UNSUBSCRIBE_CHANNEL)
        await subscriber.subscribe(this.TOPICS_QUERY_CHANNEL)
        this.logger.log(
            `Subscribed to ${this.INCOMING_CHANNEL}, ${this.ACK_CHANNEL}, ${this.STATUS_QUERY_CHANNEL}, ${this.TOPIC_SUBSCRIBE_CHANNEL}, ${this.TOPIC_UNSUBSCRIBE_CHANNEL}, ${this.TOPICS_QUERY_CHANNEL}`,
        )

        subscriber.on('message', (channel, message) => {
            this.handleMessage(channel, message).catch((error: unknown) => {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)
                this.logger.error(
                    `Failed to handle message on ${channel}: ${errorMessage}`,
                )
            })
        })
    }

    private async handleMessage(
        channel: string,
        rawMessage: string,
    ): Promise<void> {
        this.logger.log(`Received event on ${channel}: ${rawMessage}`)

        if (channel === this.INCOMING_CHANNEL) {
            await this.handleIncomingNotification(rawMessage)
        } else if (channel === this.ACK_CHANNEL) {
            await this.handleAcknowledgment(rawMessage)
        } else if (channel === this.STATUS_QUERY_CHANNEL) {
            await this.handleStatusQuery(rawMessage)
        } else if (channel === this.TOPIC_SUBSCRIBE_CHANNEL) {
            await this.handleTopicSubscribe(rawMessage)
        } else if (channel === this.TOPIC_UNSUBSCRIBE_CHANNEL) {
            await this.handleTopicUnsubscribe(rawMessage)
        } else if (channel === this.TOPICS_QUERY_CHANNEL) {
            await this.handleTopicQuery(rawMessage)
        }
    }

    private async handleIncomingNotification(
        rawMessage: string,
    ): Promise<void> {
        let message: Partial<INotification>
        try {
            message = JSON.parse(rawMessage) as INotification
        } catch (error) {
            this.logger.error(
                `Failed to parse message: ${rawMessage}. \n error: ${error}`,
            )
            return
        }

        // required fields
        if (
            !message.notificationId ||
            !message.senderId ||
            !message.payload ||
            (!message.receiverId && !message.topicId)
        ) {
            this.logger.error(
                `Invalid message format: ${JSON.stringify(message)}`,
            )
            return
        }

        const enhancedMessage: INotification = {
            notificationId: message.notificationId,
            senderId: message.senderId,
            receiverId: message.receiverId,
            topicId: message.topicId,
            payload: message.payload,
            metadata: message.metadata,
            status: 'pending',
            timestamp: message.timestamp
                ? new Date(message.timestamp)
                : new Date(),
        }

        const publisher = this.redisService.getPublisher()

        // (blocking - critical path)
        await publisher.publish(
            this.DISPATCH_CHANNEL,
            JSON.stringify(enhancedMessage),
        )

        // (non-blocking, fire-and-forget)
        this.notificationService.saveNotificationAsync(enhancedMessage)

        this.logger.log(
            `Event ${enhancedMessage.notificationId} enriched with status='pending' and dispatched to ${this.DISPATCH_CHANNEL}`,
        )
    }

    private async handleAcknowledgment(notificationId: string): Promise<void> {
        this.logger.log(
            `Received acknowledgment for notification: ${notificationId}`,
        )

        try {
            await this.notificationService.updateNotificationStatus(
                notificationId,
                'delivered',
            )
            this.logger.log(
                `Updated notification ${notificationId} status to 'delivered'`,
            )
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Failed to update notification status: ${errorMessage}`,
            )
        }
    }

    private async handleStatusQuery(rawMessage: string): Promise<void> {
        let query: { correlationId: string; notificationId: string }
        try {
            query = JSON.parse(rawMessage)
        } catch (_error) {
            this.logger.error(`Failed to parse status query: ${rawMessage}`)
            return
        }

        const { correlationId, notificationId } = query

        try {
            const notification =
                await this.notificationService.getNotificationById(
                    notificationId,
                )

            if (!notification) {
                this.logger.warn(`Notification not found: ${notificationId}`)
                return
            }

            const response = {
                correlationId,
                notificationId: notification.notificationId,
                status: notification.status,
                timestamp: notification.timestamp.toISOString(),
            }

            const publisher = this.redisService.getPublisher()
            await publisher.publish(
                this.STATUS_RESPONSE_CHANNEL,
                JSON.stringify(response),
            )

            this.logger.log(
                `Sent status response for notification ${notificationId}`,
            )
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Failed to handle status query for ${notificationId}: ${errorMessage}`,
            )
        }
    }

    private async handleTopicSubscribe(rawMessage: string): Promise<void> {
        let payload: { receiverId: string; topicId: string }
        try {
            payload = JSON.parse(rawMessage)
        } catch (_error) {
            this.logger.error(
                `Failed to parse subscribe payload: ${rawMessage}`,
            )
            return
        }

        const { receiverId, topicId } = payload
        if (!receiverId || !topicId) {
            this.logger.error(
                `Invalid subscribe payload: ${JSON.stringify(payload)}`,
            )
            return
        }

        await this.subscriptionService.subscribe(receiverId, topicId)
    }

    private async handleTopicUnsubscribe(rawMessage: string): Promise<void> {
        let payload: { receiverId: string; topicId: string }
        try {
            payload = JSON.parse(rawMessage)
        } catch (_error) {
            this.logger.error(
                `Failed to parse unsubscribe payload: ${rawMessage}`,
            )
            return
        }

        const { receiverId, topicId } = payload
        if (!receiverId || !topicId) {
            this.logger.error(
                `Invalid unsubscribe payload: ${JSON.stringify(payload)}`,
            )
            return
        }

        await this.subscriptionService.unsubscribe(receiverId, topicId)
    }

    private async handleTopicQuery(rawMessage: string): Promise<void> {
        let payload: { receiverId: string; correlationId: string }
        try {
            payload = JSON.parse(rawMessage)
        } catch (_error) {
            this.logger.error(
                `Failed to parse topic query payload: ${rawMessage}`,
            )
            return
        }

        const { receiverId, correlationId } = payload
        if (!receiverId || !correlationId) {
            this.logger.error(
                `Invalid topic query payload: ${JSON.stringify(payload)}`,
            )
            return
        }

        try {
            const topics =
                await this.subscriptionService.getSubscriptions(receiverId)
            const publisher = this.redisService.getPublisher()
            await publisher.publish(
                this.TOPICS_QUERY_RESPONSE_CHANNEL,
                JSON.stringify({ correlationId, receiverId, topics }),
            )
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Failed to resolve topics for receiverId=${receiverId}: ${message}`,
            )
        }
    }
}
