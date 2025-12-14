import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [AuthModule],
  providers: [TeachersService, LocalStrategy],
  controllers: [TeachersController],
  exports: [TeachersService],
})
export class TeachersModule {}
