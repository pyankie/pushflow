import { Module } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [DispatcherService],
  exports: [DispatcherService],
})
export class DispatcherModule {}
