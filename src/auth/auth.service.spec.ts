import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Mocked, TestBed } from '@suites/unit';

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
      const mockUser = { id: 1, registry: '123321' };
      const mockToken = { access_token: 'jwt_token' };

      jwtService.signAsync.mockResolvedValue('jwt_token');

      const result = await service.login(mockUser);

      expect(result).toEqual(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.registry,
      });
    });

    it('should handle jwtService errors gracefully', async () => {
      const mockUser = { id: 1, registry: '123321' };

      jwtService.signAsync.mockRejectedValue(new Error('JWT Error'));

      await expect(service.login(mockUser)).rejects.toThrow('JWT Error');
    });
  });
});
