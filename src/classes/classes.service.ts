import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { UserRoleType } from 'src/common/enums';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private usersService: UsersService,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const teacher = await this.usersService.findById(createClassDto.teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const isTeacher = teacher.roles.some(
      (role) => role.role === UserRoleType.TEACHER,
    );
    if (!isTeacher) {
      throw new BadRequestException('User is not a teacher');
    }

    const newClass = this.classRepository.create({
      ...createClassDto,
      teacher,
    });
    return this.classRepository.save(newClass);
  }

  findAll(includeInactive = false) {
    const query: { relations: string[]; where?: { isActive: boolean } } = {
      relations: ['teacher', 'enrolledStudents'],
    };

    if (!includeInactive) {
      query.where = { isActive: true };
    }
    return this.classRepository.find(query);
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
    const classEntity = await this.findOne(id);

    if (updateClassDto.teacherId) {
      const teacher = await this.usersService.findById(
        updateClassDto.teacherId,
      );
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
      const isTeacher = teacher.roles.some(
        (role) => role.role === UserRoleType.TEACHER,
      );
      if (!isTeacher) {
        throw new BadRequestException('User is not a teacher');
      }

      classEntity.teacher = teacher;
    }

    if (updateClassDto.name) classEntity.name = updateClassDto.name;
    if (updateClassDto.days) classEntity.days = updateClassDto.days;
    if (updateClassDto.startTime)
      classEntity.startTime = updateClassDto.startTime;
    if (updateClassDto.durationMinutes)
      classEntity.durationMinutes = updateClassDto.durationMinutes;

    return this.classRepository.save(classEntity);
  }

  async activate(id: string) {
    const classEntity = await this.findOne(id);

    classEntity.isActive = true;
    return this.classRepository.save(classEntity);
  }

  async deactivate(id: string) {
    const classEntity = await this.findOne(id);
    classEntity.isActive = false;
    return this.classRepository.save(classEntity);
  }

  async enrollStudent(classId: string, studentId: string) {
    const classEntity = await this.findOne(classId);
    if (!classEntity.isActive) {
      throw new BadRequestException('Cannot enroll in an inactive class');
    }

    const student = await this.usersService.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const isStudent = student.roles.some(
      (role) => role.role === UserRoleType.STUDENT,
    );
    if (!isStudent) {
      throw new BadRequestException('User is not a student');
    }

    if (!student.isActive) {
      throw new BadRequestException('Cannot enroll an inactive student');
    }

    const alreadyEnrolled = classEntity.enrolledStudents.some(
      (s) => s.id === student.id,
    );
    if (alreadyEnrolled) {
      throw new BadRequestException(
        'Student is already enrolled in this class',
      );
    }

    classEntity.enrolledStudents.push(student);
    return this.classRepository.save(classEntity);
  }

  async unenrollStudent(classId: string, studentId: string) {
    const classEntity = await this.findOne(classId);

    const studentIndex = classEntity.enrolledStudents.findIndex(
      (s) => s.id === studentId,
    );

    if (studentIndex === -1) {
      throw new NotFoundException('Student is not enrolled in this class');
    }

    classEntity.enrolledStudents.splice(studentIndex, 1);
    return this.classRepository.save(classEntity);
  }
}
