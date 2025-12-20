import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { TeachersService } from '../teachers.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private teacherService: TeachersService) {
    super();
  }

  async validate(username: string, password: string): Promise<User> {
    const user = await this.teacherService.validateCredentials(
      username,
      password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
