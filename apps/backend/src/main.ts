import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend (Next.js on port 3000)
  app.enableCors({
    origin: [
      'http://localhost:3000', // Local frontend
      'http://localhost:3001',
      'http://localhost:3002',
      'http://13.232.183.239:3000', // Frontend on EC2
      'http://13.232.183.239:3001', // Backend on EC2
      'https://atbltd.health', // Production frontend
      'https://www.atbltd.health', // Production www subdomain
      'http://13.232.183.239',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Global validation pipe - auto-validates all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 ATB Backend running on http://localhost:${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
}

bootstrap();
