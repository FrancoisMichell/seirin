import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const newStudent = this.studentsRepository.create(createStudentDto);
    const result = await this.studentsRepository.insert(newStudent);
    return this.findOne(result.identifiers[0].id);
  }

  async findAll() {
    return await this.studentsRepository.find();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOneBy({ id });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const updatedStudent = await this.studentsRepository.update(
      id,
      updateStudentDto,
    );
    if (!updatedStudent.affected)
      throw new NotFoundException('Student not found');
    return this.findOne(id);
  }
}
