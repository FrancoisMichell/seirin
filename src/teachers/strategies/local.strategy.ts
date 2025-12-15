import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { TeachersService } from '../teachers.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private teacherService: TeachersService) {
    super();
  }

  validate(
    username: string,
    password: string,
  ): { id: number; registry: string } {
    const user = this.teacherService.validateCredentials(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
