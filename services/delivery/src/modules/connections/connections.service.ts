import { Logger } from '@nestjs/common'
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConnectionRegistry } from './connections.registry'

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ConnectionService
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer() server: Server
    private readonly logger = new Logger(ConnectionService.name)

    constructor(private readonly registery: ConnectionRegistry) {}

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
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: socketId=${client.id}`)
        this.registery.unregister(client.id)
    }
}
