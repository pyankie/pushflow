import { Module } from '@nestjs/common'
import { NotificationModule } from './modules/notifications/notification.module'
import { RedisModule } from './modules/redis/redis.module'

@Module({
    imports: [RedisModule, NotificationModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
