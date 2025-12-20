import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { TeachersService } from '../teachers.service';
import { User } from 'src/users/entities/user.entity';
import { UserRoleType } from 'src/common/enums';
import { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let teachersService: Mocked<TeachersService>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(LocalStrategy).compile();
    strategy = unit;
    teachersService = unitRef.get(TeachersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        registry: '123321',
        password: 'hashedPassword',
        name: 'Teacher Name',
        roles: [{ id: '1', role: UserRoleType.TEACHER }],
      } as User;

      teachersService.validateCredentials.mockResolvedValue(mockUser);

      const result = await strategy.validate('123321', 'teste123');

      expect(result).toEqual(mockUser);
      expect(teachersService.validateCredentials).toHaveBeenCalledWith(
        '123321',
        'teste123',
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      teachersService.validateCredentials.mockResolvedValue(null);

      await expect(
        strategy.validate('wrongRegistry', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        strategy.validate('wrongRegistry', 'wrongPassword'),
      ).rejects.toThrow('Invalid credentials');

      expect(teachersService.validateCredentials).toHaveBeenCalledWith(
        'wrongRegistry',
        'wrongPassword',
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      teachersService.validateCredentials.mockResolvedValue(null);

      await expect(
        strategy.validate('123321', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(teachersService.validateCredentials).toHaveBeenCalledWith(
        '123321',
        'wrongPassword',
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      teachersService.validateCredentials.mockResolvedValue(null);

      await expect(
        strategy.validate('123321', 'incorrectPass'),
      ).rejects.toThrow(UnauthorizedException);
      expect(teachersService.validateCredentials).toHaveBeenCalledWith(
        '123321',
        'incorrectPass',
      );
    });

    it('should validate credentials with different usernames and passwords', async () => {
      const mockUser1: User = {
        id: '1',
        registry: 'user1',
        name: 'User One',
      } as User;

      const mockUser2: User = {
        id: '2',
        registry: 'user2',
        name: 'User Two',
      } as User;

      teachersService.validateCredentials
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      const result1 = await strategy.validate('user1', 'pass1');
      const result2 = await strategy.validate('user2', 'pass2');

      expect(result1).toEqual(mockUser1);
      expect(result2).toEqual(mockUser2);
      expect(teachersService.validateCredentials).toHaveBeenCalledWith(
        'user1',
        'pass1',
      );
      expect(teachersService.validateCredentials).toHaveBeenCalledWith(
        'user2',
        'pass2',
      );
    });
  });
});
