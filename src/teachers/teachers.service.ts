import { Injectable } from '@nestjs/common';
import { PasswordUtil } from 'src/common/utils/password.util';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class TeachersService {
  constructor(private usersService: UsersService) {}

  findByRegistry(registry: string) {
    return this.usersService.findByRegistry(registry);
  }

  async validateCredentials(
    registry: string,
    password: string,
  ): Promise<User | null> {
    const teacher = await this.findByRegistry(registry);
    if (!teacher || !teacher.password) {
      return null;
    }

    const isPasswordValid = await PasswordUtil.compare(
      password,
      teacher.password,
    );
    if (!isPasswordValid) {
      return null;
    }

    return teacher;
  }
}
