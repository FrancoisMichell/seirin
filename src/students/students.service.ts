import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UsersService } from 'src/users/users.service';
import { UserRoleType } from 'src/common/enums';

@Injectable()
export class StudentsService {
  constructor(private usersService: UsersService) {}

  async create(createStudentDto: CreateStudentDto) {
    return this.usersService.create(createStudentDto, [UserRoleType.STUDENT]);
  }

  async findAll() {
    return await this.usersService.findByRole(UserRoleType.STUDENT);
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
