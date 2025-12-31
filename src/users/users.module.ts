import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';
import { PasswordService } from 'src/common/utils/password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole])],
  providers: [UsersService, PasswordService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
