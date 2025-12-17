import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { TeachersService } from '../teachers.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private teacherService: TeachersService) {
    super();
  }

  async validate(
    username: string,
    password: string,
  ): Promise<{ id: string; registry: string }> {
    const user = await this.teacherService.validateCredentials(
      username,
      password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { id: user.id, registry: user.registry! };
  }
}
