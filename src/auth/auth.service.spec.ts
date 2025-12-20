import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Mocked, TestBed } from '@suites/unit';
import { User } from 'src/users/entities/user.entity';
import { UserRoleType } from 'src/common/enums';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: Mocked<JwtService>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(AuthService).compile();
    service = unit;
    jwtService = unitRef.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return a JWT token on login', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        registry: '123321',
        roles: [{ role: UserRoleType.TEACHER }],
      } as User;
      const mockToken = { token: 'jwt_token', user: mockUser };

      jwtService.signAsync.mockResolvedValue('jwt_token');

      const result = await service.login(mockUser);

      expect(result).toEqual(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.registry,
        roles: [mockUser.roles[0].role],
      });
    });

    it('should return a JWT token on login with multiple roles', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        registry: '123321',
        roles: [{ role: UserRoleType.TEACHER }, { role: UserRoleType.STUDENT }],
      } as User;
      const mockToken = { token: 'jwt_token', user: mockUser };

      jwtService.signAsync.mockResolvedValue('jwt_token');

      const result = await service.login(mockUser);

      expect(result).toEqual(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.registry,
        roles: [mockUser.roles[0].role, mockUser.roles[1].role],
      });
    });

    it('should handle jwtService errors gracefully', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        registry: '123321',
        roles: [{ role: UserRoleType.TEACHER }],
      } as User;

      jwtService.signAsync.mockRejectedValue(new Error('JWT Error'));

      await expect(service.login(mockUser)).rejects.toThrow('JWT Error');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.registry,
        roles: [mockUser.roles[0].role],
      });
    });
  });
});
