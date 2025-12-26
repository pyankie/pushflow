import { Module } from '@nestjs/common'
import { ConnectionModule } from './modules/connections/connections.module'
import { DeliveryModule } from './modules/delivery/delivery.module'
import { RedisModule } from './modules/redis/redis.module'

@Module({
    imports: [ConnectionModule, RedisModule, DeliveryModule],
})
export class AppModule {}
