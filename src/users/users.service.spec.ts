/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@suites/unit';
import { UsersService } from './users.service';
import { Belt, UserRoleType } from 'src/common/enums';
import { UserRole } from './entities/user-role.entity';
import { Mocked } from '@suites/doubles.jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PasswordUtil } from '../common/utils/password.util';
import { ConfigService } from '@nestjs/config';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Mocked<Repository<User>>;
  let userRolesRepository: Mocked<Repository<UserRole>>;

  beforeAll(async () => {
    // Initialize PasswordUtil with a mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'security.bcryptSaltRounds') return 10;
        return undefined;
      }),
    } as unknown as ConfigService;

    PasswordUtil.setConfigService(mockConfigService);

    const { unit, unitRef } = await TestBed.solitary(UsersService).compile();
    service = unit;
    usersRepository = unitRef.get(getRepositoryToken(User) as never);
    userRolesRepository = unitRef.get(getRepositoryToken(UserRole) as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with student role', async () => {
      const userData = {
        name: 'John Doe',
        registry: '987654',
        password: 'password123',
        belt: Belt.White,
      };
      const roles = [UserRoleType.STUDENT];

      const createdUser = {
        id: '123',
        name: userData.name,
        registry: userData.registry,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        password: expect.any(String), // Password will be hashed
        belt: userData.belt,
      } as User;

      const userRole = {
        id: 'role-1',
        role: UserRoleType.STUDENT,
        user: createdUser,
      } as UserRole;

      const savedUser = {
        ...createdUser,
        roles: [userRole],
      } as User;

      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.insert.mockResolvedValue({
        identifiers: [{ id: '123' }],
        generatedMaps: [],
        raw: [],
      });
      userRolesRepository.create.mockReturnValue(userRole);
      userRolesRepository.insert.mockResolvedValue({
        identifiers: [{ id: 'role-1' }],
        generatedMaps: [],
        raw: [],
      });
      usersRepository.findOne.mockResolvedValue(savedUser);

      const result = await service.create(userData, roles);

      expect(result).toBeDefined();
      expect(result?.name).toBe('John Doe');
      expect(result?.roles).toHaveLength(1);
      expect(result?.roles[0].role).toBe(UserRoleType.STUDENT);

      // Verify password was hashed (should not be plain text)
      const createCall = usersRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('password123');
      expect(createCall.password).toBeDefined();

      expect(usersRepository.insert).toHaveBeenCalled();
      expect(userRolesRepository.insert).toHaveBeenCalled();
    });

    it('should create a user with multiple roles', async () => {
      const userData = {
        name: 'Jane Teacher',
        registry: '123456',
        password: 'pass456',
        belt: Belt.Black,
      };
      const roles = [UserRoleType.STUDENT, UserRoleType.TEACHER];

      const createdUser = {
        id: '456',
        ...userData,
      } as User;

      const studentRole = {
        id: 'role-1',
        role: UserRoleType.STUDENT,
        user: createdUser,
      } as UserRole;

      const teacherRole = {
        id: 'role-2',
        role: UserRoleType.TEACHER,
        user: createdUser,
      } as UserRole;

      const savedUser = {
        ...createdUser,
        roles: [studentRole, teacherRole],
      } as User;

      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.insert.mockResolvedValue({
        identifiers: [{ id: '456' }],
        generatedMaps: [],
        raw: [],
      });
      userRolesRepository.create
        .mockReturnValueOnce(studentRole)
        .mockReturnValueOnce(teacherRole);
      userRolesRepository.insert.mockResolvedValue({
        identifiers: [{ id: 'role-1' }, { id: 'role-2' }],
        generatedMaps: [],
        raw: [],
      });
      usersRepository.findOne.mockResolvedValue(savedUser);

      const result = await service.create(userData, roles);

      expect(result).toBeDefined();
      expect(result?.roles).toHaveLength(2);
      expect(result?.roles.map((r) => r.role)).toContain(UserRoleType.STUDENT);
      expect(result?.roles.map((r) => r.role)).toContain(UserRoleType.TEACHER);
    });
  });

  describe('findByRegistry', () => {
    it('should return a user by registry with roles', async () => {
      const userRole = {
        id: 'role-1',
        role: UserRoleType.STUDENT,
      } as UserRole;

      const mockUser = {
        id: '123',
        name: 'John Doe',
        registry: '987654',
        roles: [userRole],
      } as User;

      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByRegistry('987654');

      expect(result).toBeDefined();
      expect(result?.registry).toBe('987654');
      expect(result?.roles).toHaveLength(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { registry: '987654' },
        relations: ['roles'],
      });
    });

    it('should return null for non-existing registry', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.findByRegistry('nonexistent');

      expect(result).toBeNull();
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { registry: 'nonexistent' },
        relations: ['roles'],
      });
    });
  });

  describe('findById', () => {
    it('should return a user by id with roles', async () => {
      const userRole = {
        id: 'role-1',
        role: UserRoleType.TEACHER,
      } as UserRole;

      const mockUser = {
        id: '456',
        name: 'Jane Teacher',
        registry: '123456',
        roles: [userRole],
      } as User;

      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('456');

      expect(result).toBeDefined();
      expect(result?.id).toBe('456');
      expect(result?.roles).toHaveLength(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: '456' },
        relations: ['roles'],
      });
    });

    it('should return null for non-existing id', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        relations: ['roles'],
      });
    });
  });

  describe('findByRole', () => {
    it('should return users filtered by student role', async () => {
      const students = [
        {
          id: '1',
          name: 'Student One',
          registry: '111',
        } as User,
        {
          id: '2',
          name: 'Student Two',
          registry: '222',
        } as User,
      ];

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(students),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.STUDENT);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Student One');
      expect(result[1].name).toBe('Student Two');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('user.roles', 'role');
      expect(queryBuilder.where).toHaveBeenCalledWith('role.role = :role', {
        role: UserRoleType.STUDENT,
      });
    });

    it('should return users filtered by teacher role', async () => {
      const teachers = [
        {
          id: '3',
          name: 'Teacher One',
          registry: '333',
        } as User,
      ];

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(teachers),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.TEACHER);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Teacher One');
      expect(queryBuilder.where).toHaveBeenCalledWith('role.role = :role', {
        role: UserRoleType.TEACHER,
      });
    });

    it('should return empty array when no users have the role', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.TEACHER);

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a user and return updated data', async () => {
      const userId = '123';
      const updateData = {
        name: 'Updated Name',
        belt: Belt.Blue,
      };

      const updatedUser = {
        id: userId,
        name: 'Updated Name',
        password: null,
        belt: Belt.Blue,
        registry: '987654',
        birthday: null,
        trainingSince: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
      } as User;

      usersRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      usersRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.belt).toBe(Belt.Blue);
      expect(usersRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['roles'],
      });
    });

    it('should return null for non-existing user', async () => {
      const userId = 'non-existent';
      const updateData = { name: 'Updated' };

      usersRepository.update.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.update(userId, updateData);

      expect(result).toBeNull();
      expect(usersRepository.update).toHaveBeenCalledWith(userId, updateData);
    });
  });
});
