import { Module } from '@nestjs/common';
import mongoose from 'mongoose';

@Module({
  providers: [
    {
      provide: 'MONGO_CONNECTION',
      useFactory: async () => {
        const uri = process.env.MONGO_URL || 'mongodb://localhost/spf';

        // Only include credentials if provided
        const user = process.env.MONGO_USER;
        const pass = process.env.MONGO_PASSWORD;

        const options: Parameters<typeof mongoose.connect>[1] = {};
        if (user && pass) {
          options.user = user;
          options.pass = pass;
        }

        try {
          const instance = await mongoose.connect(uri);
          console.log('MongoDB connection established');
          // Return the Mongoose instance so injection works
          return instance;
        } catch (err) {
          console.error('Unable to connect to MongoDB!', err);
          // Fail fast so the app doesn't continue without DB
          throw err;
        }
      },
    },
  ],
  // Export if other modules need to inject it
  exports: ['MONGO_CONNECTION'],
})
export default class MongoModule {}
