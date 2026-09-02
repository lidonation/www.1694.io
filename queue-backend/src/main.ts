import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.APP_PORT ?? 9999);
}
bootstrap().catch((error) => {
  Logger.error('Failed to bootstrap the queue-backend application', error);
  process.exit(1);
});
