import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { DispatcherService } from './dispatcher.service';
import MongoModule from '../mongo/mongo.module';

@Module({
  imports: [RedisModule, MongoModule],
  providers: [DispatcherService],
  exports: [DispatcherService],
})
export class DispatcherModule {}
