import { ClassesService } from './classes.service';
import { UsersService } from 'src/users/users.service';
import { Mocked } from '@suites/doubles.jest';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { TestBed } from '@suites/unit';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRoleType, DayOfWeek } from 'src/common/enums';
import { NotFoundException } from '@nestjs/common';

describe('ClassesService', () => {
  let service: ClassesService;
  let classesRepository: Mocked<Repository<Class>>;
  let usersService: Mocked<UsersService>;

  const mockTeacher: User = {
    id: 'teacher-uuid',
    name: 'John Sensei',
    roles: [{ id: '1', role: UserRoleType.TEACHER }],
    isActive: true,
  } as User;

  const mockStudent: User = {
    id: 'student-uuid',
    name: 'Jane Student',
    roles: [{ id: '2', role: UserRoleType.STUDENT }],
    isActive: true,
  } as User;

  const mockClass: Class = {
    id: 'class-uuid',
    name: 'Iniciantes - Segunda 18h',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    startTime: '18:00',
    durationMinutes: 60,
    isActive: true,
    teacher: mockTeacher,
    enrolledStudents: [],
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(ClassesService).compile();
    service = unit;
    classesRepository = unitRef.get(getRepositoryToken(Class) as never);
    usersService = unitRef.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createClassDto = {
      name: 'Iniciantes - segunda e quarta',
      days: [1, 3],
      startTime: '10:00',
      durationMinutes: 60,
    };

    it('should create a new class', async () => {
      usersService.getTeacher.mockResolvedValue(mockTeacher);
      classesRepository.create.mockReturnValue(mockClass);
      classesRepository.save.mockResolvedValue(mockClass);

      const result = await service.create(createClassDto, 'teacher-uuid');

      expect(result).toEqual(mockClass);
      expect(usersService.getTeacher).toHaveBeenCalledWith('teacher-uuid');
      expect(classesRepository.create).toHaveBeenCalledWith({
        ...createClassDto,
        teacher: mockTeacher,
      });
      expect(classesRepository.save).toHaveBeenCalledWith(mockClass);
    });

    it('should throw NotFoundException when teacher not found', async () => {
      usersService.getTeacher.mockRejectedValue(
        new NotFoundException('Teacher not found'),
      );

      await expect(
        service.create(createClassDto, 'teacher-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated active classes by default', async () => {
      classesRepository.findAndCount.mockResolvedValue([[mockClass], 1]);

      const result = await service.findAll();

      expect(result).toEqual({
        data: [mockClass],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(classesRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['teacher', 'enrolledStudents'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should return paginated classes including inactive ones', async () => {
      const inactiveClass = { ...mockClass, isActive: false };
      classesRepository.findAndCount.mockResolvedValue([
        [mockClass, inactiveClass],
        2,
      ]);

      const result = await service.findAll(1, 10, true);

      expect(result).toEqual({
        data: [mockClass, inactiveClass],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
      expect(classesRepository.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        relations: ['teacher', 'enrolledStudents'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should return an empty paginated array if no classes found', async () => {
      classesRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result).toEqual({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
      expect(classesRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['teacher', 'enrolledStudents'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should handle pagination correctly', async () => {
      const mockClasses = [mockClass, mockClass, mockClass];
      classesRepository.findAndCount.mockResolvedValue([mockClasses, 25]);

      const result = await service.findAll(3, 10);

      expect(result).toEqual({
        data: mockClasses,
        meta: {
          page: 3,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
      expect(classesRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['teacher', 'enrolledStudents'],
        skip: 20,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter classes by teacherId when provided', async () => {
      classesRepository.findAndCount.mockResolvedValue([[mockClass], 1]);

      const result = await service.findAll(1, 10, false, 'teacher-uuid');

      expect(result).toEqual({
        data: [mockClass],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(classesRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true, teacher: { id: 'teacher-uuid' } },
        relations: ['teacher', 'enrolledStudents'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by teacherId with includeInactive', async () => {
      const inactiveClass = { ...mockClass, isActive: false };
      classesRepository.findAndCount.mockResolvedValue([
        [mockClass, inactiveClass],
        2,
      ]);

      const result = await service.findAll(1, 10, true, 'teacher-uuid');

      expect(result).toEqual({
        data: [mockClass, inactiveClass],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
      expect(classesRepository.findAndCount).toHaveBeenCalledWith({
        where: { teacher: { id: 'teacher-uuid' } },
        relations: ['teacher', 'enrolledStudents'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return the class if found', async () => {
      classesRepository.findOne.mockResolvedValue(mockClass);

      const result = await service.findOne('class-uuid');

      expect(result).toEqual(mockClass);
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
    });

    it('should throw NotFoundException if class not found', async () => {
      classesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        'Class not found',
      );
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
    });
  });

  describe('findByTeacher', () => {
    it('should return active classes for the given teacher by default', async () => {
      classesRepository.find.mockResolvedValue([mockClass]);

      const result = await service.findByTeacher('teacher-uuid');

      expect(result).toEqual([mockClass]);
      expect(classesRepository.find).toHaveBeenCalledWith({
        where: {
          teacher: { id: 'teacher-uuid' },
          isActive: true,
        },
        relations: ['teacher', 'enrolledStudents'],
      });
    });

    it('should return all classes for the given teacher including inactive ones', async () => {
      const inactiveClass = { ...mockClass, isActive: false };
      classesRepository.find.mockResolvedValue([mockClass, inactiveClass]);

      const result = await service.findByTeacher('teacher-uuid', true);

      expect(result).toEqual([mockClass, inactiveClass]);
      expect(classesRepository.find).toHaveBeenCalledWith({
        where: {
          teacher: { id: 'teacher-uuid' },
        },
        relations: ['teacher', 'enrolledStudents'],
      });
    });
  });

  describe('update', () => {
    const updateClassDto = {
      name: 'Graduados - Segunda 20h',
      days: [2, 4],
      startTime: '20:00',
      durationMinutes: 90,
    };

    it('should update the class details', async () => {
      classesRepository.findOne.mockResolvedValue(mockClass);
      classesRepository.save.mockResolvedValue({
        ...mockClass,
        name: updateClassDto.name,
        days: updateClassDto.days,
        startTime: updateClassDto.startTime,
        durationMinutes: updateClassDto.durationMinutes,
      });

      const result = await service.update('class-uuid', updateClassDto);

      expect(result).toEqual({
        ...mockClass,
        name: updateClassDto.name,
        days: updateClassDto.days,
        startTime: updateClassDto.startTime,
        durationMinutes: updateClassDto.durationMinutes,
      });
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(classesRepository.save).toHaveBeenCalledWith({
        ...mockClass,
        name: updateClassDto.name,
        days: updateClassDto.days,
        startTime: updateClassDto.startTime,
        durationMinutes: updateClassDto.durationMinutes,
      });
    });

    it('should update the class details without changing the teacher', async () => {
      const partialUpdateDto = {
        name: 'Graduados - Segunda 20h',
        days: [2, 4],
      };
      classesRepository.findOne.mockResolvedValue(mockClass);
      classesRepository.save.mockResolvedValue({
        ...mockClass,
        name: partialUpdateDto.name,
        days: partialUpdateDto.days,
      });

      const result = await service.update('class-uuid', partialUpdateDto);

      expect(result).toEqual({
        ...mockClass,
        name: partialUpdateDto.name,
        days: partialUpdateDto.days,
      });
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(usersService.findById).not.toHaveBeenCalled();
      expect(classesRepository.save).toHaveBeenCalledWith({
        ...mockClass,
        name: partialUpdateDto.name,
        days: partialUpdateDto.days,
      });
    });

    it('should throw NotFoundException when class not found', async () => {
      classesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('class-uuid', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('activate', () => {
    it('should activate the class', async () => {
      const inactiveClass = { ...mockClass, isActive: false };

      classesRepository.findOne.mockResolvedValue(inactiveClass);
      classesRepository.save.mockResolvedValue({
        ...inactiveClass,
        isActive: true,
      });

      const result = await service.activate('class-uuid');

      expect(result).toEqual({ ...inactiveClass, isActive: true });
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(classesRepository.save).toHaveBeenCalledWith({
        ...inactiveClass,
        isActive: true,
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate the class', async () => {
      const activeClass = { ...mockClass, isActive: true };
      classesRepository.findOne.mockResolvedValue(activeClass);
      classesRepository.save.mockResolvedValue({
        ...activeClass,
        isActive: false,
      });

      const result = await service.deactivate('class-uuid');

      expect(result).toEqual({ ...activeClass, isActive: false });
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(classesRepository.save).toHaveBeenCalledWith({
        ...activeClass,
        isActive: false,
      });
    });
  });

  describe('enrollStudent', () => {
    it('should enroll a student in an active class', async () => {
      classesRepository.findOne.mockResolvedValue(mockClass);
      usersService.getStudent.mockResolvedValue(mockStudent);
      const enrolledClass = {
        ...mockClass,
        enrolledStudents: [mockStudent],
      };
      classesRepository.save.mockResolvedValue(enrolledClass);

      const result = await service.enrollStudent('class-uuid', 'student-uuid');

      expect(result).toEqual(enrolledClass);
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(usersService.getStudent).toHaveBeenCalledWith('student-uuid');
      expect(classesRepository.save).toHaveBeenCalledWith(enrolledClass);
    });

    it('should throw BadRequestException if class is inactive', async () => {
      const inactiveClass = { ...mockClass, isActive: false };
      classesRepository.findOne.mockResolvedValue(inactiveClass);

      await expect(
        service.enrollStudent('class-uuid', 'student-uuid'),
      ).rejects.toThrow('Cannot enroll in an inactive class');
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
    });

    it('should throw BadRequestException if student is already enrolled', async () => {
      const classWithStudent = {
        ...mockClass,
        enrolledStudents: [mockStudent],
      };
      classesRepository.findOne.mockResolvedValue(classWithStudent);
      usersService.getStudent.mockResolvedValue(mockStudent);

      await expect(
        service.enrollStudent('class-uuid', 'student-uuid'),
      ).rejects.toThrow('Student is already enrolled in this class');
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(usersService.getStudent).toHaveBeenCalledWith('student-uuid');
    });
  });

  describe('unenrollStudent', () => {
    it('should unenroll a student from the class', async () => {
      const classWithStudent = {
        ...mockClass,
        enrolledStudents: [mockStudent],
      };
      classesRepository.findOne.mockResolvedValue(classWithStudent);
      const unenrolledClass = { ...mockClass, enrolledStudents: [] };
      classesRepository.save.mockResolvedValue(unenrolledClass);

      const result = await service.unenrollStudent(
        'class-uuid',
        'student-uuid',
      );

      expect(result).toEqual(unenrolledClass);
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
      expect(classesRepository.save).toHaveBeenCalledWith(unenrolledClass);
    });

    it('should throw NotFoundException if student is not enrolled in the class', async () => {
      classesRepository.findOne.mockResolvedValue({
        ...mockClass,
        enrolledStudents: [],
      });

      await expect(
        service.unenrollStudent('class-uuid', 'student-uuid'),
      ).rejects.toThrow('Student is not enrolled in this class');
      expect(classesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'class-uuid' },
        relations: ['teacher', 'enrolledStudents'],
      });
    });
  });
});
