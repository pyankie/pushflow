import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { INotification } from 'src/interfaces/notifications.interface'
import { ConnectionRegistry } from '../connections/connections.registry'
import { ConnectionService } from '../connections/connections.service'
import { RedisService } from '../redis/redis.service'

@Injectable()
export class DeliveryService implements OnModuleInit {
    private readonly DISPATCH_CHANNEL = 'notifications.dispatch'
    private readonly logger = new Logger(DeliveryService.name)

    constructor(
        private readonly redisService: RedisService,
        private readonly connectionService: ConnectionService,
        private readonly registry: ConnectionRegistry,
    ) {}

    async onModuleInit() {
        const subscriber = this.redisService.getSubscriber()

        await subscriber.subscribe(this.DISPATCH_CHANNEL)
        this.logger.log(`Subscribed to ${this.DISPATCH_CHANNEL}`)

        subscriber.on('message', (channel, message) => {
            this.deliver(message).catch((error: unknown) => {
                const errorMessage =
                    error instanceof Error ? error.message : String(error)
                this.logger.error(`Failed to deliver message: ${errorMessage}`)
            })
        })
    }

    async deliver(rawMessage: string): Promise<void> {
        let message: Partial<INotification>
        try {
            message = JSON.parse(rawMessage) as Partial<INotification>
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            this.logger.error(
                `Failed to parse message: ${rawMessage}. \nError: ${errorMessage}`,
            )
            return
        }

        // Validate required fields (either direct or topic-based)
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

        if (message.topicId) {
            const { topicId, receiverId: _rid, ...rest } = message
            this.connectionService.server.to(topicId).emit('push', rest)
            const publisher = this.redisService.getPublisher()
            await publisher.publish('notifications.ack', message.notificationId)
            this.logger.log(`Notification multicast to topicId: ${topicId}`)
            return
        }

        const receiverId = message.receiverId as string
        const { topicId: _tid, ...rest } = message

        const socketId = this.registry.getSocket(receiverId)
        if (!socketId) {
            this.logger.error(
                `No active connection for receiverId: ${receiverId}`,
            )
            return
        }

        const socket =
            this.connectionService.server.sockets.sockets.get(socketId)
        if (!socket) {
            this.logger.error(`Socket not found for receiverId: ${receiverId}`)
            return
        }

        socket.emit('push', rest)
        const publisher = this.redisService.getPublisher()
        await publisher.publish('notifications.ack', message.notificationId)
        this.logger.log(`Notification delivered to receiverId: ${receiverId}`)
    }
}
