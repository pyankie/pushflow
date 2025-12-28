import { Logger, OnModuleInit } from '@nestjs/common'
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { RedisService } from '../redis/redis.service'
import { ConnectionRegistry } from './connections.registry'

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ConnectionService
    implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
    @WebSocketServer() server: Server
    private readonly logger = new Logger(ConnectionService.name)
    private readonly TOPICS_QUERY_CHANNEL =
        process.env.TOPICS_QUERY_CHANNEL || 'topics.query'
    private readonly TOPICS_QUERY_RESPONSE_CHANNEL =
        process.env.TOPICS_QUERY_RESPONSE_CHANNEL || 'topics.query.response'
    private readonly QUERY_TIMEOUT_MS = parseInt(
        process.env.TOPIC_QUERY_TIMEOUT_MS || '5000',
        10,
    )

    private pendingTopicQueries = new Map<
        string,
        { client: Socket; receiverId: string; timeout: NodeJS.Timeout }
    >()

    constructor(
        private readonly registery: ConnectionRegistry,
        private readonly redisService: RedisService,
    ) {}

    onModuleInit() {
        const subscriber = this.redisService.getSubscriber()
        subscriber
            .subscribe(this.TOPICS_QUERY_RESPONSE_CHANNEL)
            .catch((err) => {
                this.logger.error(
                    `Failed to subscribe to ${this.TOPICS_QUERY_RESPONSE_CHANNEL}: ${
                        err instanceof Error ? err.message : String(err)
                    }`,
                )
            })

        subscriber.on('message', (channel, message) => {
            if (channel !== this.TOPICS_QUERY_RESPONSE_CHANNEL) return
            this.handleTopicQueryResponse(message).catch((error: unknown) => {
                const msg =
                    error instanceof Error ? error.message : String(error)
                this.logger.error(
                    `Failed to handle topic query response: ${msg}`,
                )
            })
        })
    }

    private generateCorrelationId(socketId: string): string {
        return `${Date.now()}-${socketId}-${randomString(6)}`
    }

    private async handleTopicQueryResponse(rawMessage: string): Promise<void> {
        let payload: {
            correlationId: string
            receiverId: string
            topics: string[]
        }
        try {
            payload = await JSON.parse(rawMessage)
        } catch (_error) {
            this.logger.error(
                `Failed to parse topic query response: ${rawMessage}`,
            )
            return
        }

        const { correlationId, receiverId, topics } = payload
        const pending = this.pendingTopicQueries.get(correlationId)
        if (!pending) return

        clearTimeout(pending.timeout)
        this.pendingTopicQueries.delete(correlationId)

        const client = pending.client
        topics.forEach((topicId) => {
            try {
                client.join(topicId)
                this.logger.log(
                    `Client ${client.id} joined topic ${topicId} (receiverId=${receiverId})`,
                )
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                this.logger.error(
                    `Failed to join client ${client.id} to topic ${topicId}: ${msg}`,
                )
            }
        })
    }

    handleConnection(client: Socket) {
        const receiverId = client.handshake.query.receiverId as string

        if (!receiverId) {
            this.logger.warn(
                `Client ${client.id} attempted to connect without receiverId`,
            )
            client.emit('error', 'Missing receiverId')
            client.disconnect()
            return
        }

        this.registery.register(receiverId, client.id)
        this.logger.log(
            `Client connected: receiverId=${receiverId}, socketId=${client.id}`,
        )

        const correlationId = this.generateCorrelationId(client.id)
        const timeout = setTimeout(() => {
            this.pendingTopicQueries.delete(correlationId)
            this.logger.warn(
                `Topic query timed out for receiverId=${receiverId}, socketId=${client.id}`,
            )
        }, this.QUERY_TIMEOUT_MS)

        this.pendingTopicQueries.set(correlationId, {
            client,
            receiverId,
            timeout,
        })

        const publisher = this.redisService.getPublisher()
        const payload = { receiverId, correlationId }
        publisher
            .publish(this.TOPICS_QUERY_CHANNEL, JSON.stringify(payload))
            .catch((err) => {
                clearTimeout(timeout)
                this.pendingTopicQueries.delete(correlationId)
                this.logger.error(
                    `Failed to publish topic query for receiverId=${receiverId}: ${
                        err instanceof Error ? err.message : String(err)
                    }`,
                )
            })
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: socketId=${client.id}`)
        this.registery.unregister(client.id)
    }
}

function randomString(length = 8) {
    return Math.random()
        .toString(36)
        .slice(2, 2 + length)
}
