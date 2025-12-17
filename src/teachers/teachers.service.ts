import { Injectable } from '@nestjs/common';
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
  ): Promise<Omit<User, 'password'> | null> {
    const teacher = await this.findByRegistry(registry);
    if (!teacher || teacher.password !== password) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = teacher;
    return result;
  }
}
