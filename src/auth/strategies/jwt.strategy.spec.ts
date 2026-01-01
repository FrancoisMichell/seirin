import { JwtStrategy } from './jwt.strategy';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data from JWT payload', () => {
      const payload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        username: '123321',
        roles: [],
      };

      const result = strategy.validate(payload);

      expect(result).toBeDefined();
      expect(result.id).toBe(payload.sub);
      expect(result.registry).toBe(payload.username);
    });

    it('should handle payload with different user ids', () => {
      const payload1 = {
        sub: 'user-id-1',
        username: 'user1',
        roles: [],
      };

      const payload2 = {
        sub: 'user-id-2',
        username: 'user2',
        roles: [],
      };

      const result1 = strategy.validate(payload1);
      const result2 = strategy.validate(payload2);

      expect(result1.id).toBe('user-id-1');
      expect(result1.registry).toBe('user1');
      expect(result2.id).toBe('user-id-2');
      expect(result2.registry).toBe('user2');
    });

    it('should extract id from sub field', () => {
      const payload = {
        sub: '12345',
        username: 'testuser',
        roles: [],
      };

      const result = strategy.validate(payload);

      expect(result.id).toBe('12345');
    });

    it('should extract registry from username field', () => {
      const payload = {
        sub: '12345',
        username: '987654',
        roles: [],
      };

      const result = strategy.validate(payload);

      expect(result.registry).toBe('987654');
    });
  });
});
