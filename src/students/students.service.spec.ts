import { StudentsService } from './students.service';
import { NotFoundException } from '@nestjs/common';
import { Belt, UserRoleType } from '../common/enums';
import { UsersService } from 'src/users/users.service';
import { TestBed } from '@suites/unit';
import { Mocked } from '@suites/doubles.jest';
import { User } from 'src/users/entities/user.entity';
import { QueryStudentsDto } from './dto/query-students.dto';
import { PaginatedResponse } from 'src/common/interfaces';

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
    const instructorId = 'instructor-123';

    it('should create user with student role and instructor', async () => {
      const dto = { name: 'John Doe', belt: Belt.WHITE };
      const userMock: User = {
        id: '1',
        roles: [studentRole],
        instructor: { id: instructorId } as User,
        ...dto,
      } as User;

      usersService.create.mockResolvedValue(userMock);

      const result = await service.create(dto, instructorId);
      expect(usersService.create).toHaveBeenCalledWith(
        { ...dto, instructor: { id: instructorId } },
        [UserRoleType.STUDENT],
      );
      expect(result).toEqual(userMock);
    });

    it('should create and return a new student with all possible fields', async () => {
      const createStudentDto = {
        name: 'Jane Doe',
        registry: '2021002',
        belt: Belt.BLUE,
        birthday: new Date('2000-01-01'),
        trainingSince: new Date('2020-01-01'),
      };
      const createdStudent = {
        id: '2',
        ...createStudentDto,
        roles: [studentRole],
        instructor: { id: instructorId } as User,
      } as User;
      usersService.create.mockResolvedValue(createdStudent);

      const result = await service.create(createStudentDto, instructorId);
      expect(usersService.create).toHaveBeenCalledWith(
        { ...createStudentDto, instructor: { id: instructorId } },
        [UserRoleType.STUDENT],
      );
      expect(result).toEqual(createdStudent);
    });

    it('should throw an error if creation fails', async () => {
      const createStudentDto = { name: 'John Doe', belt: Belt.WHITE };
      usersService.create.mockRejectedValue(new Error('Creation failed'));
      await expect(
        service.create(createStudentDto, instructorId),
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    const instructorId = 'instructor-123';

    it('should return an array of students without filters', async () => {
      const emptyQuery: QueryStudentsDto = {};
      const students = [
        { id: '1', name: 'John Doe', roles: [studentRole] },
        { id: '2', name: 'Jane Doe', roles: [studentRole] },
      ] as User[];
      const paginatedStudents: PaginatedResponse<User> = {
        data: students,
        meta: {
          total: students.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      usersService.findByRole.mockResolvedValue(paginatedStudents);

      const result = await service.findAll(emptyQuery, instructorId);
      expect(usersService.findByRole).toHaveBeenCalledWith(
        UserRoleType.STUDENT,
        {},
        instructorId,
      );
      expect(result).toStrictEqual(paginatedStudents);
    });

    it('should return an empty array if no students found without filters', async () => {
      const emptyQuery: QueryStudentsDto = {};
      const paginatedStudents: PaginatedResponse<User> = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      usersService.findByRole.mockResolvedValue(paginatedStudents);

      const result = await service.findAll(emptyQuery, instructorId);
      expect(usersService.findByRole).toHaveBeenCalledWith(
        UserRoleType.STUDENT,
        {},
        instructorId,
      );
      expect(result).toStrictEqual(paginatedStudents);
    });

    it.each`
      scenario                   | queryParams                             | expectedCallParams
      ${'with name filter'}      | ${{ name: 'John' }}                     | ${{ name: 'John' }}
      ${'with registry filter'}  | ${{ registry: '2021001' }}              | ${{ registry: '2021001' }}
      ${'with belt filter'}      | ${{ belt: [Belt.BLUE] }}                | ${{ belt: [Belt.BLUE] }}
      ${'with isActive filter'}  | ${{ isActive: true }}                   | ${{ isActive: true }}
      ${'with multiple filters'} | ${{ name: 'Jane', belt: [Belt.GREEN] }} | ${{ name: 'Jane', belt: [Belt.GREEN] }}
    `(
      'should return students $scenario',
      async ({ queryParams, expectedCallParams }) => {
        const students = [
          { id: '1', name: 'John Doe', roles: [studentRole] },
        ] as User[];
        const paginatedStudents: PaginatedResponse<User> = {
          data: students,
          meta: {
            total: students.length,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        };

        usersService.findByRole.mockResolvedValue(paginatedStudents);

        const result = await service.findAll(
          queryParams as QueryStudentsDto,
          instructorId,
        );
        expect(usersService.findByRole).toHaveBeenCalledWith(
          UserRoleType.STUDENT,
          expectedCallParams,
          instructorId,
        );
        expect(result).toStrictEqual(paginatedStudents);
      },
    );

    it('should throw an error if retrieval fails', async () => {
      const emptyQuery: QueryStudentsDto = {};

      usersService.findByRole.mockRejectedValue(new Error('Retrieval failed'));
      await expect(service.findAll(emptyQuery, instructorId)).rejects.toThrow(
        'Retrieval failed',
      );
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
