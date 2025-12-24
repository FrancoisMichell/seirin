/* eslint-disable @typescript-eslint/unbound-method */
import { PasswordUtil } from './password.util';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PasswordUtil', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    mockConfigService = {
      get: jest.fn(),
    } as any;

    PasswordUtil.setConfigService(mockConfigService);
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password with default salt rounds', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz';

      mockConfigService.get.mockReturnValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtil.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should hash a password with configured salt rounds', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = '$2b$12$abcdefghijklmnopqrstuvwxyz';
      const customSaltRounds = 12;

      mockConfigService.get.mockReturnValue(customSaltRounds);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtil.hashPassword(password);

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'security.bcryptSaltRounds',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(password, customSaltRounds);
      expect(result).toBe(hashedPassword);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samePassword';
      const hash1 = '$2b$10$salt1abcdefghijklmnopqrstuv';
      const hash2 = '$2b$10$salt2xyzabcdefghijklmnopqrs';

      mockConfigService.get.mockReturnValue(undefined);

      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce(hash1)
        .mockResolvedValueOnce(hash2);

      const result1 = await PasswordUtil.hashPassword(password);
      const result2 = await PasswordUtil.hashPassword(password);

      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
      expect(result1).not.toBe(result2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = '$2b$10$emptyHash';

      mockConfigService.get.mockReturnValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await PasswordUtil.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const password = 'correctPassword';
      const hash = '$2b$10$hashedCorrectPassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtil.compare(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'wrongPassword';
      const hash = '$2b$10$hashedCorrectPassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtil.compare(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hash = '$2b$10$hashedPassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await PasswordUtil.compare(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const hash = '$2b$10$hashedSpecialPassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await PasswordUtil.compare(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });
  });
});
