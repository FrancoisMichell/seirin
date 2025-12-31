/* eslint-disable @typescript-eslint/unbound-method */
import { TestBed } from '@suites/unit';
import { UsersService } from './users.service';
import { Belt, UserRoleType } from 'src/common/enums';
import { UserRole } from './entities/user-role.entity';
import { Mocked } from '@suites/doubles.jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PasswordService } from '../common/utils/password.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Mocked<Repository<User>>;
  let userRolesRepository: Mocked<Repository<UserRole>>;
  let passwordService: Mocked<PasswordService>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(UsersService).compile();
    service = unit;
    usersRepository = unitRef.get(getRepositoryToken(User) as never);
    userRolesRepository = unitRef.get(getRepositoryToken(UserRole) as never);
    passwordService = unitRef.get(PasswordService);
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
        belt: Belt.WHITE,
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
      userRolesRepository.create.mockReturnValue(userRole);
      usersRepository.save.mockResolvedValue(savedUser);
      passwordService.hashPassword.mockResolvedValue('$2b$10$hashedPassword');

      const result = await service.create(userData, roles);

      expect(result).toBeDefined();
      expect(result?.name).toBe('John Doe');
      expect(result?.roles).toHaveLength(1);
      expect(result?.roles[0].role).toBe(UserRoleType.STUDENT);

      // Verify password was hashed (should not be plain text)
      const createCall = usersRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('password123');
      expect(createCall.password).toBeDefined();

      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('should create a user with multiple roles', async () => {
      const userData = {
        name: 'Jane Teacher',
        registry: '123456',
        password: 'pass456',
        belt: Belt.BLACK,
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
      userRolesRepository.create
        .mockReturnValueOnce(studentRole)
        .mockReturnValueOnce(teacherRole);
      usersRepository.save.mockResolvedValue(savedUser);

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
    it('should return paginated users filtered by role with default pagination', async () => {
      const users = [
        {
          id: '1',
          name: 'Student One',
          registry: '111',
          belt: Belt.WHITE,
          isActive: true,
          roles: [{ role: UserRoleType.STUDENT }],
        } as User,
        {
          id: '2',
          name: 'Student Two',
          registry: '222',
          belt: Belt.BLUE,
          isActive: true,
          roles: [{ role: UserRoleType.STUDENT }],
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.STUDENT, {});

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.roles',
        'role',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith('role.role = :role', {
        role: UserRoleType.STUDENT,
      });
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply pagination correctly', async () => {
      const users = [
        {
          id: '11',
          name: 'Student Eleven',
          registry: '1111',
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(25),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.STUDENT, {
        page: 3,
        limit: 5,
      });

      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(5);
      expect(queryBuilder.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should filter by name', async () => {
      const users = [
        {
          id: '1',
          name: 'John Student',
          registry: '111',
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findByRole(UserRoleType.STUDENT, {
        name: 'John',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(user.name) LIKE LOWER(:name)',
        { name: '%John%' },
      );
    });

    it('should filter by registry', async () => {
      const users = [
        {
          id: '1',
          name: 'Student One',
          registry: '12345',
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findByRole(UserRoleType.STUDENT, {
        registry: '12345',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.registry = :registry',
        { registry: '12345' },
      );
    });

    it('should filter by belt', async () => {
      const users = [
        {
          id: '1',
          name: 'Student One',
          belt: Belt.BLUE,
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findByRole(UserRoleType.STUDENT, {
        belt: Belt.BLUE,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.belt = :belt', {
        belt: Belt.BLUE,
      });
    });

    it('should filter by isActive status', async () => {
      const users = [
        {
          id: '1',
          name: 'Active Student',
          isActive: true,
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findByRole(UserRoleType.STUDENT, {
        isActive: true,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should apply multiple filters at once', async () => {
      const users = [
        {
          id: '1',
          name: 'John Student',
          registry: '12345',
          belt: Belt.BLUE,
          isActive: true,
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(users),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findByRole(UserRoleType.STUDENT, {
        name: 'John',
        registry: '12345',
        belt: Belt.BLUE,
        isActive: true,
        page: 1,
        limit: 20,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(user.name) LIKE LOWER(:name)',
        { name: '%John%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.registry = :registry',
        { registry: '12345' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.belt = :belt', {
        belt: Belt.BLUE,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should return empty data when no users match filters', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.STUDENT, {
        name: 'NonExistent',
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(23),
        getMany: jest.fn().mockResolvedValue([]),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.STUDENT, {
        limit: 10,
      });

      expect(result.meta.totalPages).toBe(3); // Math.ceil(23 / 10) = 3
    });

    it('should work with teacher role', async () => {
      const teachers = [
        {
          id: '1',
          name: 'Teacher One',
          registry: '999',
          roles: [{ role: UserRoleType.TEACHER }],
        } as User,
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue(teachers),
      } as unknown as SelectQueryBuilder<User>;

      usersRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(UserRoleType.TEACHER, {});

      expect(result.data).toHaveLength(1);
      expect(queryBuilder.where).toHaveBeenCalledWith('role.role = :role', {
        role: UserRoleType.TEACHER,
      });
    });
  });

  describe('getTeacher', () => {
    it('should return a teacher user when valid teacherId is provided', async () => {
      const mockTeacher = {
        id: 'teacher-123',
        name: 'Mr. Smith',
        roles: [{ role: UserRoleType.TEACHER }],
        isActive: true,
      } as User;

      usersRepository.findOne.mockResolvedValue(mockTeacher);

      const result = await service.getTeacher('teacher-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('teacher-123');
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'teacher-123' },
        relations: ['roles'],
      });
    });

    it('should throw NotFoundException when teacher does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.getTeacher('non-existent-id')).rejects.toThrow(
        'Teacher not found',
      );
    });

    it('should throw BadRequestException when user is not a teacher', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        roles: [{ role: UserRoleType.STUDENT }],
        isActive: true,
      } as User;

      usersRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.getTeacher('user-123')).rejects.toThrow(
        'User is not a teacher',
      );
    });

    it('should throw BadRequestException when teacher is not active', async () => {
      const mockTeacher = {
        id: 'teacher-456',
        name: 'Ms. Jane',
        roles: [{ role: UserRoleType.TEACHER }],
        isActive: false,
      } as User;

      usersRepository.findOne.mockResolvedValue(mockTeacher);

      await expect(service.getTeacher('teacher-456')).rejects.toThrow(
        'Teacher is not active',
      );
    });
  });

  describe('getStudent', () => {
    it('should return a student user when valid studentId is provided', async () => {
      const mockStudent = {
        id: 'student-123',
        name: 'Mr. Smith',
        roles: [{ role: UserRoleType.STUDENT }],
        isActive: true,
      } as User;

      usersRepository.findOne.mockResolvedValue(mockStudent);

      const result = await service.getStudent('student-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('student-123');
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'student-123' },
        relations: ['roles'],
      });
    });

    it('should throw NotFoundException when student does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.getStudent('non-existent-id')).rejects.toThrow(
        'Student not found',
      );
    });

    it('should throw BadRequestException when user is not a student', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        roles: [{ role: UserRoleType.TEACHER }],
        isActive: true,
      } as User;

      usersRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.getStudent('user-123')).rejects.toThrow(
        'User is not a student',
      );
    });

    it('should throw BadRequestException when student is not active', async () => {
      const mockStudent = {
        id: 'student-456',
        name: 'Ms. Jane',
        roles: [{ role: UserRoleType.STUDENT }],
        isActive: false,
      } as User;

      usersRepository.findOne.mockResolvedValue(mockStudent);

      await expect(service.getStudent('student-456')).rejects.toThrow(
        'Student is not active',
      );
    });
  });

  describe('update', () => {
    it('should update a user and return updated data', async () => {
      const userId = '123';
      const updateData = {
        name: 'Updated Name',
        belt: Belt.BLUE,
      };

      const updatedUser = {
        id: userId,
        name: 'Updated Name',
        password: null,
        belt: Belt.BLUE,
        registry: '987654',
        birthday: null,
        trainingSince: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
        classes: [],
        enrolledClasses: [],
        sessions: [],
      } as unknown as User;

      usersRepository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      usersRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
      expect(result?.belt).toBe(Belt.BLUE);
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
