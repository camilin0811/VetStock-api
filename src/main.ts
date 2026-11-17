import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.config';
import { configurarSwagger } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  configurarSwagger(app);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
