import { Module } from '@nestjs/common'
import { ConnectionModule } from '../connections/connections.module'
import { RedisModule } from '../redis/redis.module'
import { DeliveryService } from './delivery.service'

@Module({
    imports: [ConnectionModule, RedisModule],
    providers: [DeliveryService],
    exports: [DeliveryService],
})
export class DeliveryModule {}
