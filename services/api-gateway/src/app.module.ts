import { Module } from '@nestjs/common';
import { RedisModule } from './modules/redis/redis.module';
import { NotificationModule } from './modules/notifications/notification.module';

@Module({
  imports: [RedisModule, NotificationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
