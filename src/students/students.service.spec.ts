import { StudentsService } from './students.service';
import { NotFoundException } from '@nestjs/common';
import { Belt, UserRoleType } from '../common/enums';
import { UsersService } from 'src/users/users.service';
import { TestBed } from '@suites/unit';
import { Mocked } from '@suites/doubles.jest';
import { User } from 'src/users/entities/user.entity';

describe('StudentsService', () => {
  let service: StudentsService;
  let usersService: Mocked<UsersService>;

  const studentRole = { id: '1', role: UserRoleType.STUDENT };

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(StudentsService).compile();
    service = unit;
    usersService = unitRef.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create user with student role', async () => {
      const dto = { name: 'John Doe', belt: Belt.White };
      const userMock: User = {
        id: '1',
        roles: [studentRole],
        ...dto,
      } as User;

      usersService.create.mockResolvedValue(userMock);

      const result = await service.create(dto);
      expect(usersService.create).toHaveBeenCalledWith(dto, [
        UserRoleType.STUDENT,
      ]);
      expect(result).toEqual(userMock);
    });

    it('should create and return a new student with birthday and trainingSince fields', async () => {
      const createStudentDto = {
        name: 'Jane Doe',
        belt: Belt.Blue,
        birthday: new Date('2000-01-01'),
        trainingSince: new Date('2020-01-01'),
      };
      const createdStudent = {
        id: '2',
        ...createStudentDto,
        roles: [studentRole],
      } as User;
      usersService.create.mockResolvedValue(createdStudent);

      const result = await service.create(createStudentDto);
      expect(usersService.create).toHaveBeenCalledWith(createStudentDto, [
        UserRoleType.STUDENT,
      ]);
      expect(result).toEqual(createdStudent);
    });

    it('should throw an error if creation fails', async () => {
      const createStudentDto = { name: 'John Doe', belt: Belt.White };
      usersService.create.mockRejectedValue(new Error('Creation failed'));
      await expect(service.create(createStudentDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of students', async () => {
      const students = [
        { id: '1', name: 'John Doe', roles: [studentRole] },
        { id: '2', name: 'Jane Doe', roles: [studentRole] },
      ] as User[];

      usersService.findByRole.mockResolvedValue(students);

      const result = await service.findAll();
      expect(usersService.findByRole).toHaveBeenCalledWith(
        UserRoleType.STUDENT,
      );
      expect(result).toEqual(students);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array if no students found', async () => {
      usersService.findByRole.mockResolvedValue([]);
      const result = await service.findAll();
      expect(usersService.findByRole).toHaveBeenCalledWith(
        UserRoleType.STUDENT,
      );
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const student = { id: '1', name: 'John Doe' } as User;
      usersService.findById.mockResolvedValue(student);

      const result = await service.findOne('1');
      expect(usersService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(student);
    });

    it('should throw NotFoundException if student not found', async () => {
      usersService.findById.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(usersService.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update and return the updated student', async () => {
      const updateStudentDto = { name: 'John Smith' };
      const updatedStudent = { id: '1', name: 'John Smith' };
      usersService.update.mockResolvedValue(updatedStudent as User);

      const result = await service.update('1', updateStudentDto);

      expect(usersService.update).toHaveBeenCalledWith('1', updateStudentDto);
      expect(result).toEqual(updatedStudent);
    });
  });
});
