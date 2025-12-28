import { Module } from '@nestjs/common'
import { RedisModule } from '../redis/redis.module'
import { ConnectionRegistry } from './connections.registry'
import { ConnectionService } from './connections.service'

@Module({
    imports: [RedisModule],
    providers: [ConnectionRegistry, ConnectionService],
    exports: [ConnectionRegistry, ConnectionService],
})
export class ConnectionModule {}
