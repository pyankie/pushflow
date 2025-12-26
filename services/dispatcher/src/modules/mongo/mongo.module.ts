import { Module } from '@nestjs/common'
import mongoose from 'mongoose'
import { NotificationService } from './notification.service'

@Module({
    providers: [
        {
            provide: 'MONGO_CONNECTION',
            useFactory: async () => {
                const uri = process.env.MONGO_URL || 'mongodb://localhost/spf'

                // Only include credentials if provided
                const user = process.env.MONGO_USER
                const pass = process.env.MONGO_PASSWORD

                const options: Parameters<typeof mongoose.connect>[1] = {}
                if (user && pass) {
                    options.user = user
                    options.pass = pass
                }

                try {
                    await mongoose.connect(uri)
                    console.log('MongoDB connection established')
                    // Return the connection
                    return mongoose.connection
                } catch (err) {
                    console.error('Unable to connect to MongoDB!', err)
                    throw err
                }
            },
        },
        NotificationService,
    ],
    exports: ['MONGO_CONNECTION', NotificationService],
})
export default class MongoModule {}
