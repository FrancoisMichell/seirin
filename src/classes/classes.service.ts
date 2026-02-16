import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { PostgresErrorCode } from 'src/common/constants/postgres-error-codes';
import { UpdateClassDto } from './dto/update-class.dto';
import { PaginatedResponse } from 'src/common/interfaces';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityUtil } from 'src/common/utils/entity.util';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private usersService: UsersService,
  ) {}

  async create(createClassDto: CreateClassDto, teacherId: string) {
    try {
      const teacher = await this.usersService.getTeacher(teacherId);

      const newClass = this.classRepository.create({
        ...createClassDto,
        teacher,
      });
      return this.classRepository.save(newClass);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestException('Invalid teacher reference');
      }
      throw new BadRequestException('Failed to create class');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    includeInactive = false,
    teacherId?: string,
  ): Promise<PaginatedResponse<Class>> {
    const where: { isActive?: boolean; teacher?: { id: string } } = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (teacherId) {
      where.teacher = { id: teacherId };
    }

    const [data, total] = await this.classRepository.findAndCount({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['teacher', 'enrolledStudents'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['teacher', 'enrolledStudents'],
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    return classEntity;
  }

  async findByTeacher(teacherId: string, includeInactive = false) {
    const where: { teacher: { id: string }; isActive?: boolean } = {
      teacher: { id: teacherId },
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.classRepository.find({
      where,
      relations: ['teacher', 'enrolledStudents'],
    });
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    try {
      const classEntity = await this.findOne(id);

      EntityUtil.updateFields(classEntity, updateClassDto, ['teacherId']);

      return this.classRepository.save(classEntity);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestException('Invalid teacher reference');
      }
      throw new BadRequestException('Failed to update class');
    }
  }

  async activate(id: string) {
    const classEntity = await this.findOne(id);
    return EntityUtil.toggleActive(classEntity, this.classRepository, true);
  }

  async deactivate(id: string) {
    const classEntity = await this.findOne(id);
    return EntityUtil.toggleActive(classEntity, this.classRepository, false);
  }

  async enrollStudent(classId: string, studentId: string) {
    try {
      const classEntity = await this.findOne(classId);
      EntityUtil.ensureActive(
        classEntity,
        'Cannot enroll in an inactive class',
      );

      const student = await this.usersService.getStudent(studentId);

      EntityUtil.ensureNotInArray(
        classEntity.enrolledStudents,
        student.id,
        'Student is already enrolled in this class',
      );

      classEntity.enrolledStudents.push(student);
      return this.classRepository.save(classEntity);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestException('Invalid student or class reference');
      }
      throw new BadRequestException('Failed to enroll student in class');
    }
  }

  async unenrollStudent(classId: string, studentId: string) {
    const classEntity = await this.findOne(classId);

    EntityUtil.removeFromArray(
      classEntity.enrolledStudents,
      studentId,
      'Student is not enrolled in this class',
    );

    return this.classRepository.save(classEntity);
  }
}
