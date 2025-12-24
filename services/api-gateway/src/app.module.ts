import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './modules/redis/redis.module';
import { NotificationModule } from './modules/notifications/notification.module';

@Module({
  imports: [RedisModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
