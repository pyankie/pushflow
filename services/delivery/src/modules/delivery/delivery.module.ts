import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { ConnectionModule } from '../connections/connections.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConnectionModule, RedisModule],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
