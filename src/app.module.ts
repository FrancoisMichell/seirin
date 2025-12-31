import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import configuration, { envValidationSchema } from '../config/configuration';
import { datasourceOptions } from '../db/datasource';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { ClassSessionsModule } from './class-sessions/class-sessions.module';
import { AttendancesModule } from './attendances/attendances.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRoot(datasourceOptions),
    StudentsModule,
    AuthModule,
    TeachersModule,
    UsersModule,
    ClassesModule,
    ClassSessionsModule,
    AttendancesModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    ...(process.env.NODE_ENV !== 'test'
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
  ],
})
export class AppModule {}
