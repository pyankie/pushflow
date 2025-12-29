import { Module } from '@nestjs/common'
import { RedisModule } from '../redis/redis.module'
import { TopicsController } from './topics.controller'
import { TopicsService } from './topics.service'

@Module({
    imports: [RedisModule],
    controllers: [TopicsController],
    providers: [TopicsService],
})
export class TopicsModule {}
