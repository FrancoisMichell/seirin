import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupApp } from './common/setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply common application configuration (pipes, interceptors, etc.)
  setupApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Seirin - Martial Arts School Management API')
    .setDescription(
      'Complete REST API for managing martial arts schools: students, teachers, classes, sessions, and attendance tracking',
    )
    .setVersion('1.0.0')
    .setContact(
      'Seirin Development Team',
      'https://github.com/yourusername/seirin',
      'contact@seirin.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api-staging.seirin.com', 'Staging')
    .addServer('https://api.seirin.com', 'Production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('teachers', 'Teacher management and authentication')
    .addTag('students', 'Student management operations')
    .addTag('classes', 'Class/Turma management')
    .addTag('class-sessions', 'Individual class session management')
    .addTag('attendances', 'Attendance tracking and reporting')
    .addTag('health', 'Health check and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  app.use(helmet());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
