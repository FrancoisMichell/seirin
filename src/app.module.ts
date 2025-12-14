import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import configuration, { envValidationSchema } from '../config/configuration';
import { datasourceOptions } from '../db/datasource';
import { HealthController } from './health/health.controller';
import { AuthModule } from './common/auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRoot(datasourceOptions),
    StudentsModule,
    AuthModule,
    TeachersModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
