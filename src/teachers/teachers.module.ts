import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from 'src/users/users.module';
import { PasswordService } from 'src/common/utils/password.service';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [TeachersService, LocalStrategy, PasswordService],
  controllers: [TeachersController],
  exports: [TeachersService],
})
export class TeachersModule {}
