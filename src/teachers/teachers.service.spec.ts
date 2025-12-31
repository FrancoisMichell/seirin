import { TestBed } from '@suites/unit';
import { TeachersService } from './teachers.service';
import { UsersService } from 'src/users/users.service';
import { Mocked } from '@suites/doubles.jest';
import { User } from 'src/users/entities/user.entity';
import { PasswordService } from 'src/common/utils/password.service';

describe('TeacherService', () => {
  let service: TeachersService;
  let usersService: Mocked<UsersService>;
  let passwordService: Mocked<PasswordService>;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(TeachersService).compile();
    service = unit;
    usersService = unitRef.get(UsersService);
    passwordService = unitRef.get(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByRegistry', () => {
    it('should return a teacher by registry', async () => {
      const mockedTeacher = { id: '1', registry: '123321' } as User;
      usersService.findByRegistry.mockResolvedValue(mockedTeacher);

      const teacher = await service.findByRegistry('123321');

      expect(teacher).toBeDefined();
      expect(teacher?.registry).toBe('123321');
      expect(teacher?.id).toBe('1');
      expect(usersService.findByRegistry).toHaveBeenCalledWith('123321');
    });

    it('should return undefined for non-existing registry', async () => {
      usersService.findByRegistry.mockResolvedValue(null);
      const teacher = await service.findByRegistry('nonexistent');
      expect(teacher).toBeNull();
      expect(usersService.findByRegistry).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('validateCredentials', () => {
    it('should return teacher data without password for valid credentials', async () => {
      const hashedPassword = '$2b$10$mockedHash';
      passwordService.hashPassword.mockResolvedValue(hashedPassword);
      passwordService.compare.mockResolvedValue(true);

      const mockedTeacher = {
        id: '1',
        registry: '123321',
        password: hashedPassword,
      } as User;
      usersService.findByRegistry.mockResolvedValue(mockedTeacher);
      const result = await service.validateCredentials('123321', 'teste123');
      expect(result).toBeDefined();
      expect(result).toEqual({
        id: '1',
        registry: '123321',
        password: hashedPassword,
      });
    });

    it('should return null for invalid registry', async () => {
      usersService.findByRegistry.mockResolvedValue(null);
      const result = await service.validateCredentials(
        'wrongRegistry',
        'teste123',
      );
      expect(result).toBeNull();
      expect(usersService.findByRegistry).toHaveBeenCalledWith('wrongRegistry');
    });

    it('should return null for invalid password', async () => {
      const hashedPassword = '$2b$10$mockedHash';
      const mockedTeacher = {
        id: '1',
        registry: '123321',
        password: hashedPassword,
      } as User;
      usersService.findByRegistry.mockResolvedValue(mockedTeacher);
      passwordService.compare.mockResolvedValue(false);

      const result = await service.validateCredentials(
        '123321',
        'wrongPassword',
      );
      expect(result).toBeNull();
      expect(usersService.findByRegistry).toHaveBeenCalledWith('123321');
    });

    it('should return null when teacher has no password', async () => {
      const mockedTeacher = {
        id: '1',
        registry: '123321',
        password: null,
      } as User;
      usersService.findByRegistry.mockResolvedValue(mockedTeacher);
      const result = await service.validateCredentials('123321', 'anyPassword');
      expect(result).toBeNull();
      expect(usersService.findByRegistry).toHaveBeenCalledWith('123321');
    });

    it('should return null when teacher password is undefined', async () => {
      const mockedTeacher = {
        id: '1',
        registry: '123321',
      } as User;
      usersService.findByRegistry.mockResolvedValue(mockedTeacher);
      const result = await service.validateCredentials('123321', 'anyPassword');
      expect(result).toBeNull();
      expect(usersService.findByRegistry).toHaveBeenCalledWith('123321');
    });
  });
});
