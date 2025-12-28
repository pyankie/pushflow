import { Module } from "@nestjs/common";
import { ConnectionRegistry } from "./connections.registry";
import { ConnectionService } from "./connections.service";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [RedisModule],
  providers: [ConnectionRegistry, ConnectionService],
  exports: [ConnectionRegistry, ConnectionService],
})
export class ConnectionModule {}
