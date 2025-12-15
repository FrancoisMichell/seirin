import { type Request } from 'express';

export class AuthenticatedRequestDto extends Request {
  user: {
    id: number;
    registry: string;
  };
}
