import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for WebSocket connections
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // const port = process.env.DELIVERY_PORT || 8989; // for local testing (dev) -- to avoid port conflicts with with docker itself
  const port = process.env.DELIVERY_PORT || 3002; //production -- inside docker
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`WebSocket server is available on the same port: ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
