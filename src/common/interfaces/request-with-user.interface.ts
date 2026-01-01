import { UserRoleType } from '../enums';

export interface RequestWithUser {
  user?: {
    id: string;
    registry: string;
    roles: UserRoleType[];
  };
}
