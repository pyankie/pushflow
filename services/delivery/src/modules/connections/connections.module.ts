import { Module } from '@nestjs/common'
import { ConnectionRegistry } from './connections.registry'
import { ConnectionService } from './connections.service'

@Module({
    imports: [],
    providers: [ConnectionRegistry, ConnectionService],
    exports: [ConnectionRegistry, ConnectionService],
})
export class ConnectionModule {}
