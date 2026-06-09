import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { getCorsOrigins } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Moving/updating a task re-sends the whole project (all columns + tasks),
  // which can exceed Express's default 100kb body limit → "request entity too large".
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://rodrigomendez.dev", "https://avatars.githubusercontent.com"],
      },
    },
  }));
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(Number(process.env.PORT) || 3500);
}
bootstrap();
