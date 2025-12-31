import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Configures common settings for the NestJS application.
 * This function is used by both the main application and E2E tests
 * to ensure consistent behavior across environments.
 */
export function setupApp(app: INestApplication): void {
  // Enable class serialization (respects @Exclude, @Expose decorators)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Configure global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
      stopAtFirstError: false,
    }),
  );
}
