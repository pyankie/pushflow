import { Module } from '@nestjs/common'
import { DispatcherModule } from './modules/dispatcher/dispatcher.module'
import MongoModule from './modules/mongo/mongo.module'

@Module({
    imports: [DispatcherModule, MongoModule],
})
export class AppModule {}
