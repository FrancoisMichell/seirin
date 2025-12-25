import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
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

  async create(createClassDto: CreateClassDto) {
    const teacher = await this.usersService.getTeacher(
      createClassDto.teacherId,
    );

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
      const teacher = await this.usersService.getTeacher(
        updateClassDto.teacherId,
      );
      classEntity.teacher = teacher;
    }

    EntityUtil.updateFields(classEntity, updateClassDto, ['teacherId']);

    return this.classRepository.save(classEntity);
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
    const classEntity = await this.findOne(classId);
    EntityUtil.ensureActive(classEntity, 'Cannot enroll in an inactive class');

    const student = await this.usersService.getStudent(studentId);

    EntityUtil.ensureNotInArray(
      classEntity.enrolledStudents,
      student.id,
      'Student is already enrolled in this class',
    );

    classEntity.enrolledStudents.push(student);
    return this.classRepository.save(classEntity);
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
