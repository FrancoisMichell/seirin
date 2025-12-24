import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from './entities/user-role.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRoleType } from 'src/common/enums';
import { PasswordUtil } from 'src/common/utils/password.util';
import { EntityUtil } from 'src/common/utils/entity.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
  ) {}

  async create(
    userData: Partial<User>,
    roles: UserRoleType[],
  ): Promise<User | null> {
    //TODO: Validar se fazendo com user.roles = [lista de roles] funciona. Dessa forma usaria o insert apenas 1x ao invés de 2

    if (userData.password) {
      userData.password = await PasswordUtil.hashPassword(userData.password);
    }
    const user = this.usersRepository.create(userData);
    const newUser = await this.usersRepository.insert(user);

    const userRoles = roles.map((role) =>
      this.userRolesRepository.create({ user, role }),
    );
    await this.userRolesRepository.insert(userRoles);

    return this.findById(newUser.identifiers[0].id as string);
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

  async findByRole(role: UserRoleType): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.role = :role', { role })
      .getMany();
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
