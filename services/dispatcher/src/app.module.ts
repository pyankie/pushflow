import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DispatcherModule } from './dispatcher/dispatcher.module';

@Module({
  imports: [DispatcherModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
