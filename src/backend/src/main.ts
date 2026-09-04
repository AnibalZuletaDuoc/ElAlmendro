import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Contrato OpenAPI generado desde los decoradores (seccion 6 del documento).
  const config = new DocumentBuilder()
    .setTitle('TimeFlow API')
    .setDescription('Capa de negocio: jornadas, actividades, sesiones y reportes.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const puerto = Number(process.env.API_PORT ?? 4000);
  await app.listen(puerto);
  console.log(`API escuchando en http://localhost:${puerto}/api`);
}

void bootstrap();
