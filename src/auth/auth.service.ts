import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: { id: number; registry: string }) {
    const payload = { sub: user.id, username: user.registry };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
