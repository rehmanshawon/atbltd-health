import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';

async function bootstrap() {
  // Initialize Sentry error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    });
  }

  const app = await NestFactory.create(AppModule);

  // Global Sentry exception filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

  // Enable CORS for frontend (Next.js on port 3000)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://atbltd.health',
      'https://www.atbltd.health',
      'https://api.atbltd.health',
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
  console.log(`📊 Prometheus metrics available at http://localhost:${port}/api/metrics`);
}

bootstrap();
