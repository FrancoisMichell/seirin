import { User } from '../../src/users/entities/user.entity';
import { Class } from '../../src/classes/entities/class.entity';
import { ClassSession } from '../../src/class-sessions/entities/class-session.entity';
import { Attendance } from '../../src/attendances/entities/attendance.entity';

// Re-export entities for test use
export { User, Class, ClassSession, Attendance };

// API Response Types
export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
