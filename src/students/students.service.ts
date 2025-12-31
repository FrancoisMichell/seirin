import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UsersService } from 'src/users/users.service';
import { UserRoleType } from 'src/common/enums';
import { PaginatedResponse } from 'src/common/interfaces';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class StudentsService {
  constructor(private usersService: UsersService) {}

  async create(createStudentDto: CreateStudentDto) {
    return this.usersService.create(createStudentDto, [UserRoleType.STUDENT]);
  }

  async findAll(query: QueryStudentsDto): Promise<PaginatedResponse<User>> {
    return this.usersService.findByRole(UserRoleType.STUDENT, query);
  }

  async findOne(id: string) {
    const student = await this.usersService.findById(id);
    if (!student) throw new NotFoundException('Student not found');

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    return this.usersService.update(id, updateStudentDto);
  }
}
