import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectionModule } from './modules/connections/connections.module';
import { RedisModule } from './modules/redis/redis.module';
import { DeliveryModule } from './modules/delivery/delivery.module';

@Module({
  imports: [ConnectionModule, RedisModule, DeliveryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
