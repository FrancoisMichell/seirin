import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import configuration, { envValidationSchema } from '../config/configuration';
import { datasourceOptions } from '../db/datasource';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';
import { UsersModule } from './users/users.module';
import { PasswordUtil } from './common/utils/password.util';

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
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    PasswordUtil.setConfigService(this.configService);
  }
}
