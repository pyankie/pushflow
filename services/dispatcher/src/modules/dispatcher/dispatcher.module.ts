import { Module } from '@nestjs/common'
import MongoModule from '../mongo/mongo.module'
import { RedisModule } from '../redis/redis.module'
import { DispatcherService } from './dispatcher.service'

@Module({
    imports: [RedisModule, MongoModule],
    providers: [DispatcherService],
    exports: [DispatcherService],
})
export class DispatcherModule {}
