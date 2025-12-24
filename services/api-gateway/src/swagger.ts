import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  port: number,
  path: string = 'api/docs',
) {
  const gatewayHost = process.env.GATEWAY_HOST || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  const config = new DocumentBuilder()
    .setTitle('Pushflow API')
    .setDescription('Stand Alone Push Notification Framework')
    .setVersion('1.0.0')
    .addTag('notifications', 'Notifications routing endpoints')
    .addServer(`${protocol}://${gatewayHost}:${port}`, 'API Gateway')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(
    `Swagger UI available at ${protocol}://${gatewayHost}:${port}/${path}`,
  );
}
