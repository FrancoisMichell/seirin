import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRoleType } from 'src/common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'your_jwt_secret_key',
    });
  }

  validate(payload: { username: string; sub: string; roles: UserRoleType[] }) {
    return {
      id: payload.sub,
      registry: payload.username,
      roles: payload.roles || [],
    };
  }
}
