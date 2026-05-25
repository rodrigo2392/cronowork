import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(3500);
}
bootstrap();
