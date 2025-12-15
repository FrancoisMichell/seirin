import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { AuthService } from '../auth/auth.service';
import { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { AuthenticatedRequestDto } from './dto/authenticated-request.dto';

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
      const mockUser = { id: 1, registry: '123321' };
      const mockToken = { access_token: 'jwt_token' };

      authService.login.mockResolvedValue(mockToken);

      const req = { user: mockUser };
      const result = await controller.login(req as AuthenticatedRequestDto);

      expect(result).toEqual(mockToken);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return teacher profile when user is authenticated', () => {
      const mockProfile = { id: 1, registry: '123321', password: 'teste123' };

      teacherService.findByRegistry.mockReturnValue(mockProfile);

      const req = { user: { id: 1, registry: '123321' } };
      const result = controller.getProfile(req as AuthenticatedRequestDto);

      expect(result).toEqual(mockProfile);
      expect(teacherService.findByRegistry).toHaveBeenCalledWith('123321');
    });

    it('should return undefined when teacher is not found', () => {
      teacherService.findByRegistry.mockReturnValue(undefined);

      const req = { user: { id: 2, registry: 'nonexistent' } };
      const result = controller.getProfile(req as AuthenticatedRequestDto);

      expect(result).toBeUndefined();
      expect(teacherService.findByRegistry).toHaveBeenCalledWith('nonexistent');
    });
  });
});
