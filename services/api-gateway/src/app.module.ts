import { Module } from '@nestjs/common'
import { NotificationModule } from './modules/notifications/notification.module'
import { RedisModule } from './modules/redis/redis.module'
import { TopicsModule } from './modules/topics/topics.module'

@Module({
    imports: [RedisModule, NotificationModule, TopicsModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
