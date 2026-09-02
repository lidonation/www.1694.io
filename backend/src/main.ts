import 'tsconfig-paths/register';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
      parameterLimit: 50000,
    }),
  );
  app.enableCors();

  const port = process.env.PORT || 8000;
  await app.listen(port);
}
bootstrap().catch((error) => {
  Logger.error('Failed to bootstrap the backend application', error);
  process.exit(1);
});
