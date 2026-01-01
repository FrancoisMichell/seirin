import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from './entities/user-role.entity';
import { Repository } from 'typeorm';
import { PostgresErrorCode } from '../common/constants/postgres-error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRoleType } from 'src/common/enums';
import { PasswordService } from 'src/common/utils/password.service';
import { EntityUtil } from 'src/common/utils/entity.util';
import { QueryUsersDto } from './dto/query-users.dto';
import { PaginatedResponse } from 'src/common/interfaces';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    private passwordService: PasswordService,
  ) {}

  async create(
    userData: Partial<User>,
    roles: UserRoleType[],
  ): Promise<User | null> {
    try {
      if (userData.password) {
        userData.password = await this.passwordService.hashPassword(
          userData.password,
        );
      }
      const user = this.usersRepository.create({
        ...userData,
        roles: roles.map((role) => this.userRolesRepository.create({ role })),
      });

      return this.usersRepository.save(user);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new BadRequestException(
          'User with given registry already exists',
        );
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findByRegistry(registry: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { registry },
      relations: ['roles'],
    });
  }

  async findByRole(
    role: UserRoleType,
    query: QueryUsersDto,
    instructorId?: string,
  ): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      limit = 10,
      name,
      registry,
      belt,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.role = :role', { role });

    // Filter by instructor if provided (for students)
    if (instructorId) {
      queryBuilder.andWhere('user.instructor_id = :instructorId', {
        instructorId,
      });
    }

    // Apply filters
    if (name) {
      queryBuilder.andWhere('LOWER(user.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    if (registry) {
      queryBuilder.andWhere('lower(user.registry) LIKE lower(:registry)', {
        registry: `%${registry}%`,
      });
    }

    if (belt && belt.length > 0) {
      queryBuilder.andWhere('user.belt IN (:...belt)', { belt });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTeacher(teacherId: string): Promise<User> {
    const teacher = await this.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const isTeacher = teacher.roles.some(
      (role) => role.role === UserRoleType.TEACHER,
    );
    if (!isTeacher) {
      throw new BadRequestException('User is not a teacher');
    }

    EntityUtil.ensureActive(teacher, 'Teacher is not active');

    return teacher;
  }

  async getStudent(studentId: string): Promise<User> {
    const student = await this.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const isStudent = student.roles.some(
      (role) => role.role === UserRoleType.STUDENT,
    );
    if (!isStudent) {
      throw new BadRequestException('User is not a student');
    }

    EntityUtil.ensureActive(student, 'Student is not active');

    return student;
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }
}
