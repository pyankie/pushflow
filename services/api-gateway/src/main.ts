import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.GATEWAY_PORT || 9090;
  await app.listen(port);

  console.log(`API Gateway is running on port ${port}`);
}
bootstrap();
