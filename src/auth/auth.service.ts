import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: User) {
    const roles = user.roles?.map((r) => r.role) || [];
    const payload = { sub: user.id, username: user.registry, roles };
    return {
      token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
