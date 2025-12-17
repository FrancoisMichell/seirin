import { type Request } from 'express';
import { User } from 'src/users/entities/user.entity';

export class AuthenticatedRequestDto extends Request {
  user: User;
}
