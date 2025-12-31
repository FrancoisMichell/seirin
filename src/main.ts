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
    .setTitle('Seirin - Student Management API')
    .setDescription('API for managing students in a martial arts school')
    .setVersion('1.0')
    .addTag('students')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.use(helmet());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
