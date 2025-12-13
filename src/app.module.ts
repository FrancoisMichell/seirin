import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import configuration, { envValidationSchema } from '../config/configuration';
import { datasourceOptions } from '../db/datasource';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRoot(datasourceOptions),
    StudentsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
