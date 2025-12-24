import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private subscriber: Redis;
  private publisher: Redis;

  async onModuleInit() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    };

    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    await Promise.all([
      this.waitForConnection(this.subscriber, 'subscriber'),
      this.waitForConnection(this.publisher, 'publisher'),
    ]);

    this.logger.log('Redis connections established (subscriber + publisher)');
  }

  private waitForConnection(client: Redis, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (client.status === 'ready') {
        this.logger.log(`Redis ${name} already connected`);
        resolve();
        return;
      }

      client.once('ready', () => {
        this.logger.log(`Redis ${name} connected`);
        resolve();
      });

      client.once('error', (err) => {
        this.logger.error(`Redis ${name} connection error: ${err.message}`);
        reject(err);
      });
    });
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  async onApplicationShutdown() {
    this.logger.log('Closing Redis connections...');
    await Promise.all([this.subscriber.quit(), this.publisher.quit()]);
    this.logger.log('Redis connections closed');
  }
}
