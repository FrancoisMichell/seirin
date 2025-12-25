import { ClassSessionsService } from './class-sessions.service';
import { Mocked } from '@suites/doubles.jest';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ClassSession } from './entities/class-session.entity';
import { ClassesService } from 'src/classes/classes.service';
import { UsersService } from 'src/users/users.service';
import { TestBed } from '@suites/unit';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { DayOfWeek } from 'src/common/enums';

describe('ClassSessionsService', () => {
  let service: ClassSessionsService;
  let sessionsRepository: Mocked<Repository<ClassSession>>;
  let classesService: Mocked<ClassesService>;
  let usersService: Mocked<UsersService>;

  const mockTrainer = {
    id: 'teacher-uuid',
    name: 'John Doe',
    isActive: true,
  } as User;

  const mockClass = {
    id: 'class-uuid',
    name: 'Iniciantes - 18h',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    isActive: true,
    teacher: mockTrainer,
  } as Class;

  const mockSession = {
    id: 'session-uuid',
    date: new Date('2024-01-01'),
    startTime: '18:00:00',
    endTime: '19:00:00',
    notes: 'First session of the year',
    isActive: true,
    class: mockClass,
    teacher: mockTrainer,
  } as ClassSession;

  beforeAll(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(ClassSessionsService).compile();
    service = unit;
    sessionsRepository = unitRef.get(getRepositoryToken(ClassSession) as never);
    classesService = unitRef.get(ClassesService);
    usersService = unitRef.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a class session', async () => {
      const createDto: CreateClassSessionDto = {
        classId: 'class-uuid',
        teacherId: 'teacher-uuid',
        date: new Date('2024-01-01'),
        startTime: '18:00:00',
        endTime: '19:00:00',
        notes: 'First session of the year',
      };

      classesService.findOne.mockResolvedValue(mockClass);
      usersService.getTeacher.mockResolvedValue(mockTrainer);
      sessionsRepository.findOne.mockResolvedValue(null);
      sessionsRepository.create.mockReturnValue(mockSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSession);
      expect(classesService.findOne).toHaveBeenCalledWith('class-uuid');
      expect(usersService.getTeacher).toHaveBeenCalledWith('teacher-uuid');
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: {
          date: createDto.date,
          class: { id: createDto.classId },
        },
      });
      expect(sessionsRepository.create).toHaveBeenCalledWith({
        ...createDto,
        teacher: mockTrainer,
        class: mockClass,
      });
      expect(sessionsRepository.save).toHaveBeenCalledWith(mockSession);
    });

    it('should throw an error if class is inactive', async () => {
      const createDto: CreateClassSessionDto = {
        classId: 'class-uuid',
        teacherId: 'teacher-uuid',
        date: new Date('2024-01-01'),
      };

      const inactiveClass = { ...mockClass, isActive: false };
      classesService.findOne.mockResolvedValue(inactiveClass);
      await expect(service.create(createDto)).rejects.toThrow(
        'Cannot create session for an inactive class',
      );

      expect(classesService.findOne).toHaveBeenCalledWith('class-uuid');
    });

    it('should throw an error if a session already exists on the same date', async () => {
      const createDto: CreateClassSessionDto = {
        classId: 'class-uuid',
        teacherId: 'teacher-uuid',
        date: new Date('2024-01-01'),
      };
      classesService.findOne.mockResolvedValue(mockClass);
      usersService.getTeacher.mockResolvedValue(mockTrainer);
      sessionsRepository.findOne.mockResolvedValue(mockSession);
      await expect(service.create(createDto)).rejects.toThrow(
        'A session for this class on the specified date already exists',
      );

      expect(classesService.findOne).toHaveBeenCalledWith('class-uuid');
      expect(usersService.getTeacher).toHaveBeenCalledWith('teacher-uuid');
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: {
          date: createDto.date,
          class: { id: createDto.classId },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all class sessions without filters', async () => {
      sessionsRepository.find.mockResolvedValue([mockSession]);

      const result = await service.findAll();

      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        relations: ['class', 'teacher'],
        where: {},
      });
    });

    it('should return filtered class sessions', async () => {
      const filters = {
        classId: 'class-uuid',
        teacherId: 'teacher-uuid',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        isActive: true,
      };
      sessionsRepository.find.mockResolvedValue([mockSession]);

      const result = await service.findAll(filters);

      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        relations: ['class', 'teacher'],
        where: {
          class: { id: 'class-uuid' },
          teacher: { id: 'teacher-uuid' },
          date: Between(new Date('2024-01-01'), new Date('2024-01-31')),
          isActive: true,
        },
      });
    });

    it('should return class sessions filtered by startDate', async () => {
      const filters = {
        startDate: new Date('2024-01-01'),
      };
      sessionsRepository.find.mockResolvedValue([mockSession]);

      const result = await service.findAll(filters);

      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        relations: ['class', 'teacher'],
        where: {
          date: MoreThanOrEqual(new Date('2024-01-01')),
        },
      });
    });

    it('should return class sessions filtered by endDate', async () => {
      const filters = {
        endDate: new Date('2024-01-31'),
      };
      sessionsRepository.find.mockResolvedValue([mockSession]);

      const result = await service.findAll(filters);

      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        relations: ['class', 'teacher'],
        where: {
          date: LessThanOrEqual(new Date('2024-01-31')),
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a class session by ID', async () => {
      sessionsRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.findOne('session-uuid');

      expect(result).toEqual(mockSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
    });

    it('should throw an error if class session not found', async () => {
      sessionsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-uuid')).rejects.toThrow(
        'Class session with ID invalid-uuid not found',
      );

      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invalid-uuid' },
        relations: ['class', 'teacher'],
      });
    });
  });

  describe('findByClass', () => {
    it('should return class sessions by class ID', async () => {
      sessionsRepository.find.mockResolvedValue([mockSession]);
      const result = await service.findByClass('class-uuid');
      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { class: { id: 'class-uuid' }, isActive: true },
        relations: ['class', 'teacher'],
        order: { date: 'DESC' },
      });
    });

    it('should return class sessions by class ID including inactive', async () => {
      sessionsRepository.find.mockResolvedValue([mockSession]);
      const result = await service.findByClass('class-uuid', true);
      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { class: { id: 'class-uuid' } },
        relations: ['class', 'teacher'],
        order: { date: 'DESC' },
      });
    });
  });

  describe('findByTeacher', () => {
    it('should return class sessions by teacher ID', async () => {
      sessionsRepository.find.mockResolvedValue([mockSession]);
      const result = await service.findByTeacher('teacher-uuid');
      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { teacher: { id: 'teacher-uuid' }, isActive: true },
        relations: ['class', 'teacher'],
        order: { date: 'DESC' },
      });
    });

    it('should return class sessions by teacher ID including inactive', async () => {
      sessionsRepository.find.mockResolvedValue([mockSession]);
      const result = await service.findByTeacher('teacher-uuid', true);
      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: { teacher: { id: 'teacher-uuid' } },
        relations: ['class', 'teacher'],
        order: { date: 'DESC' },
      });
    });
  });

  describe('findByDateRange', () => {
    it('should return class sessions within a date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      sessionsRepository.find.mockResolvedValue([mockSession]);

      const result = await service.findByDateRange(startDate, endDate);

      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: {
          date: Between(startDate, endDate),
          isActive: true,
        },
        relations: ['class', 'teacher'],
        order: { date: 'DESC' },
      });
    });

    it('should return class sessions within a date range including inactive', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      sessionsRepository.find.mockResolvedValue([mockSession]);

      const result = await service.findByDateRange(startDate, endDate, true);

      expect(result).toEqual([mockSession]);
      expect(sessionsRepository.find).toHaveBeenCalledWith({
        where: {
          date: Between(startDate, endDate),
        },
        relations: ['class', 'teacher'],
        order: { date: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('should update a class session', async () => {
      const updateDto = {
        date: new Date('2024-01-02'),
        startTime: '19:00:00',
        endTime: '20:00:00',
        notes: 'Rescheduled session',
      };
      const updatedSession = { ...mockSession, ...updateDto };
      sessionsRepository.findOne.mockResolvedValue(mockSession);
      sessionsRepository.save.mockResolvedValue(updatedSession);

      const result = await service.update('session-uuid', updateDto);

      expect(result).toEqual(updatedSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
      expect(sessionsRepository.save).toHaveBeenCalledWith(updatedSession);
    });

    it('should update a class session with new teacher and class', async () => {
      const newTeacher = {
        id: 'new-teacher-uuid',
        name: 'Jane Smith',
        isActive: true,
      } as User;

      const newClass = {
        id: 'new-class-uuid',
        name: 'Avançados - 20h',
        isActive: true,
      } as Class;

      const updateDto = {
        teacherId: 'new-teacher-uuid',
        classId: 'new-class-uuid',
      };

      const updatedSession = {
        ...mockSession,
        teacher: newTeacher,
        class: newClass,
      };

      sessionsRepository.findOne.mockResolvedValue(mockSession);
      usersService.getTeacher.mockResolvedValue(newTeacher);
      classesService.findOne.mockResolvedValue(newClass);
      sessionsRepository.save.mockResolvedValue(updatedSession);

      const result = await service.update('session-uuid', updateDto);

      expect(result).toEqual(updatedSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
      expect(usersService.getTeacher).toHaveBeenCalledWith('new-teacher-uuid');
      expect(classesService.findOne).toHaveBeenCalledWith('new-class-uuid');
      expect(sessionsRepository.save).toHaveBeenCalledWith(updatedSession);
    });

    it('should throw an error if the new class is inactive', async () => {
      const newClass = {
        id: 'new-class-uuid',
        name: 'Avançados - 20h',
        isActive: false,
      } as Class;

      const updateDto = {
        classId: 'new-class-uuid',
      };

      sessionsRepository.findOne.mockResolvedValue(mockSession);
      classesService.findOne.mockResolvedValue(newClass);

      await expect(service.update('session-uuid', updateDto)).rejects.toThrow(
        'Cannot assign session to an inactive class',
      );
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
      expect(classesService.findOne).toHaveBeenCalledWith('new-class-uuid');
    });
  });

  describe('activate', () => {
    it('should activate a class session', async () => {
      const inactiveSession = { ...mockSession, isActive: false };
      sessionsRepository.findOne.mockResolvedValue(inactiveSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      const result = await service.activate('session-uuid');

      expect(result).toEqual(mockSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
      expect(sessionsRepository.save).toHaveBeenCalledWith({
        ...inactiveSession,
        isActive: true,
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate a class session', async () => {
      const activeSession = { ...mockSession, isActive: true };
      const deactivatedSession = { ...mockSession, isActive: false };
      sessionsRepository.findOne.mockResolvedValue(activeSession);
      sessionsRepository.save.mockResolvedValue(deactivatedSession);

      const result = await service.deactivate('session-uuid');

      expect(result).toEqual(deactivatedSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
      expect(sessionsRepository.save).toHaveBeenCalledWith({
        ...activeSession,
        isActive: false,
      });
    });
  });

  describe('remove', () => {
    it('should remove a class session', async () => {
      sessionsRepository.findOne.mockResolvedValue(mockSession);
      sessionsRepository.remove.mockResolvedValue(mockSession);

      await service.remove('session-uuid');

      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
      expect(sessionsRepository.remove).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('start', () => {
    it('should start a class session', async () => {
      const unstartedSession = {
        ...mockSession,
        startTime: undefined,
      } as unknown as ClassSession;

      sessionsRepository.findOne.mockResolvedValue(unstartedSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      const result = await service.start('session-uuid');

      expect(result).toEqual(mockSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
    });

    it('should throw an error if session is already started', async () => {
      sessionsRepository.findOne.mockResolvedValue(mockSession);
      await expect(service.start('session-uuid')).rejects.toThrow(
        'Session has already been started',
      );
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
    });
  });

  describe('end', () => {
    it('should end a class session', async () => {
      const ongoingSession = {
        ...mockSession,
        endTime: undefined,
      } as unknown as ClassSession;
      sessionsRepository.findOne.mockResolvedValue(ongoingSession);
      sessionsRepository.save.mockResolvedValue(mockSession);

      const result = await service.end('session-uuid');

      expect(result).toEqual(mockSession);
      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
    });

    it('should throw an error if session has not been started', async () => {
      const unstartedSession = {
        ...mockSession,
        startTime: undefined,
      } as unknown as ClassSession;
      sessionsRepository.findOne.mockResolvedValue(unstartedSession);

      await expect(service.end('session-uuid')).rejects.toThrow(
        'Session has not been started yet',
      );

      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
    });

    it('should throw an error if session is already ended', async () => {
      sessionsRepository.findOne.mockResolvedValue(mockSession);

      await expect(service.end('session-uuid')).rejects.toThrow(
        'Session has already been ended',
      );

      expect(sessionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        relations: ['class', 'teacher'],
      });
    });
  });
});
