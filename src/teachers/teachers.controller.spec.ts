import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { AuthService } from '../auth/auth.service';
import { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { AuthenticatedRequestDto } from './dto/authenticated-request.dto';
import { User } from 'src/users/entities/user.entity';

describe('TeachersController', () => {
  let controller: TeachersController;
  let teacherService: Mocked<TeachersService>;
  let authService: Mocked<AuthService>;

  beforeAll(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(TeachersController).compile();

    controller = unit;
    teacherService = unitRef.get(TeachersService);
    authService = unitRef.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return a JWT token on successful login', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        registry: '123321',
      } as User;
      const mockToken = { access_token: 'jwt_token' };

      authService.login.mockResolvedValue(mockToken);

      const req = { user: mockUser };
      const result = await controller.login(req as AuthenticatedRequestDto);

      expect(result).toEqual(mockToken);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return teacher profile when user is authenticated', async () => {
      const mockProfile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        registry: '123321',
        password: 'teste123',
      } as User;

      teacherService.findByRegistry.mockResolvedValue(mockProfile);

      const req = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          registry: '123321',
        },
      } as AuthenticatedRequestDto;
      const result = await controller.getProfile(req);

      expect(result).toEqual(mockProfile);
      expect(teacherService.findByRegistry).toHaveBeenCalledWith('123321');
    });

    it('should return undefined when teacher is not found', async () => {
      teacherService.findByRegistry.mockResolvedValue(null);

      const req = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          registry: 'nonexistent',
        },
      } as AuthenticatedRequestDto;
      const result = await controller.getProfile(req);

      expect(result).toBeNull();
      expect(teacherService.findByRegistry).toHaveBeenCalledWith('nonexistent');
    });
  });
});
