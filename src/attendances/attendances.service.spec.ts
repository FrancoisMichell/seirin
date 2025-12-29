/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AttendancesService } from './attendances.service';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { Mocked } from '@suites/doubles.jest';
import { ClassSessionsService } from 'src/class-sessions/class-sessions.service';
import { UsersService } from 'src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TestBed } from '@suites/unit';
import { ClassesService } from 'src/classes/classes.service';
import { AttendanceStatus, DayOfWeek } from 'src/common/enums';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';
import { ClassSession } from 'src/class-sessions/entities/class-session.entity';
import { NotFoundException } from '@nestjs/common';

describe('AttendancesService', () => {
  let service: AttendancesService;
  let attendanceRepository: Mocked<Repository<Attendance>>;
  let classSessionsService: Mocked<ClassSessionsService>;
  let classService: Mocked<ClassesService>;
  let usersService: Mocked<UsersService>;

  const mockStudent: User = {
    id: 'student-uuid',
    name: 'Jane Student',
    isActive: true,
  } as User;

  const mockStudent2: User = {
    id: 'student-uuid-2',
    name: 'John Student',
    isActive: true,
  } as User;

  const mockClass: Class = {
    id: 'class-uuid',
    name: 'Iniciantes - Segunda 18h',
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    isActive: true,
    enrolledStudents: [mockStudent, mockStudent2],
  } as Class;

  const mockClassSession: ClassSession = {
    id: 'session-uuid',
    date: new Date('2024-01-15'),
    class: mockClass,
    isActive: true,
  } as ClassSession;

  const mockAttendance: Attendance = {
    id: 'attendance-uuid',
    session: mockClassSession,
    student: mockStudent,
    status: AttendanceStatus.PRESENT,
    isEnrolledClass: true,
    checkedInAt: new Date(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(AttendancesService).compile();
    service = unit;
    attendanceRepository = unitRef.get(getRepositoryToken(Attendance) as never);
    classSessionsService = unitRef.get(ClassSessionsService);
    classService = unitRef.get(ClassesService);
    usersService = unitRef.get(UsersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an attendance record', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
        status: AttendanceStatus.PRESENT,
      };

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.findOne.mockResolvedValue(null);
      classService.findOne.mockResolvedValue(mockClass);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAttendance);
      expect(classSessionsService.findOne).toHaveBeenCalledWith('session-uuid');
      expect(usersService.getStudent).toHaveBeenCalledWith('student-uuid');
      expect(attendanceRepository.save).toHaveBeenCalled();
    });

    it('should throw error if session is inactive', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
      };

      const inactiveSession = { ...mockClassSession, isActive: false };
      classSessionsService.findOne.mockResolvedValue(inactiveSession);

      await expect(service.create(createDto)).rejects.toThrow(
        'Cannot record attendance for an inactive class session',
      );
    });

    it('should throw error if attendance already exists', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
      };

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      await expect(service.create(createDto)).rejects.toThrow(
        'Attendance already recorded for this student in this session',
      );
    });

    it('should set isEnrolledClass to true when student is enrolled', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
      };

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.findOne.mockResolvedValue(null);
      classService.findOne.mockResolvedValue(mockClass);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.create(createDto);

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnrolledClass: true,
        }),
      );
    });

    it('should set isEnrolledClass to false when student is not enrolled', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'non-enrolled-student',
      };

      const nonEnrolledStudent = { id: 'non-enrolled-student' } as User;
      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      usersService.getStudent.mockResolvedValue(nonEnrolledStudent);
      attendanceRepository.findOne.mockResolvedValue(null);
      classService.findOne.mockResolvedValue(mockClass);
      attendanceRepository.create.mockReturnValue({
        ...mockAttendance,
        isEnrolledClass: false,
      });
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.create(createDto);

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isEnrolledClass: false,
        }),
      );
    });

    it('should set checkedInAt when status is PRESENT', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
        status: AttendanceStatus.PRESENT,
      };

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.findOne.mockResolvedValue(null);
      classService.findOne.mockResolvedValue(mockClass);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.create(createDto);

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          checkedInAt: expect.any(Date),
        }),
      );
    });

    it('should not set checkedInAt when status is ABSENT', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
        status: AttendanceStatus.ABSENT,
      };

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.findOne.mockResolvedValue(null);
      classService.findOne.mockResolvedValue(mockClass);
      attendanceRepository.create.mockReturnValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.create(createDto);

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          checkedInAt: undefined,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all attendances without filters', async () => {
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      const result = await service.findAll();

      expect(result).toEqual([mockAttendance]);
      expect(attendanceRepository.find).toHaveBeenCalled();
    });

    it('should filter by sessionId', async () => {
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      await service.findAll({ sessionId: 'session-uuid' });

      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            session: { id: 'session-uuid' },
          }),
        }),
      );
    });

    it('should filter by studentId', async () => {
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      await service.findAll({ studentId: 'student-uuid' });

      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            student: { id: 'student-uuid' },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      await service.findAll({ status: AttendanceStatus.PRESENT });

      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AttendanceStatus.PRESENT,
          }),
        }),
      );
    });

    it('should filter by isEnrolledClass', async () => {
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      await service.findAll({ isEnrolledClass: true });

      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isEnrolledClass: true,
          }),
        }),
      );
    });

    it('should filter by isEnrolledClass false', async () => {
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      await service.findAll({ isEnrolledClass: false });

      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isEnrolledClass: false,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an attendance by id', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);

      const result = await service.findOne('attendance-uuid');

      expect(result).toEqual(mockAttendance);
      expect(attendanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'attendance-uuid' },
        relations: ['session', 'session.class', 'student'],
      });
    });

    it('should throw NotFoundException when attendance not found', async () => {
      attendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySession', () => {
    it('should return attendances for a session', async () => {
      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      const result = await service.findBySession('session-uuid');

      expect(result).toEqual([mockAttendance]);
      expect(classSessionsService.findOne).toHaveBeenCalledWith('session-uuid');
    });
  });

  describe('findByStudent', () => {
    it('should return attendances for a student', async () => {
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      const result = await service.findByStudent('student-uuid');

      expect(result).toEqual([mockAttendance]);
      expect(usersService.getStudent).toHaveBeenCalledWith('student-uuid');
    });

    it('should limit results when limit is provided', async () => {
      usersService.getStudent.mockResolvedValue(mockStudent);
      attendanceRepository.find.mockResolvedValue([mockAttendance]);

      await service.findByStudent('student-uuid', undefined, 10);

      expect(attendanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an attendance', async () => {
      const updateDto = { notes: 'Updated notes' };
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue({
        ...mockAttendance,
        notes: 'Updated notes',
      });

      const result = await service.update('attendance-uuid', updateDto);

      expect(result.notes).toBe('Updated notes');
      expect(attendanceRepository.save).toHaveBeenCalled();
    });

    it('should set checkedInAt when changing status to PRESENT', async () => {
      const updateDto = { status: AttendanceStatus.PRESENT };
      const attendanceWithoutCheckIn = {
        ...mockAttendance,
        checkedInAt: null,
      };
      attendanceRepository.findOne.mockResolvedValue(attendanceWithoutCheckIn);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.update('attendance-uuid', updateDto);

      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          checkedInAt: expect.any(Date),
        }),
      );
    });

    it('should clear checkedInAt when changing status to ABSENT', async () => {
      const updateDto = { status: AttendanceStatus.ABSENT };
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.update('attendance-uuid', updateDto);

      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          checkedInAt: null,
        }),
      );
    });
  });

  describe('markPresent', () => {
    it('should mark attendance as present', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.markPresent('attendance-uuid');

      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AttendanceStatus.PRESENT,
          checkedInAt: expect.any(Date),
        }),
      );
    });
  });

  describe('markLate', () => {
    it('should mark attendance as late', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.markLate('attendance-uuid');

      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AttendanceStatus.LATE,
          checkedInAt: expect.any(Date),
        }),
      );
    });
  });

  describe('markAbsent', () => {
    it('should mark attendance as absent', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.markAbsent('attendance-uuid');

      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AttendanceStatus.ABSENT,
          checkedInAt: null,
        }),
      );
    });
  });

  describe('markExcused', () => {
    it('should mark attendance as excused', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.save.mockResolvedValue(mockAttendance);

      await service.markExcused('attendance-uuid');

      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AttendanceStatus.EXCUSED,
          checkedInAt: null,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should remove an attendance', async () => {
      attendanceRepository.findOne.mockResolvedValue(mockAttendance);
      attendanceRepository.remove.mockResolvedValue(mockAttendance);

      await service.remove('attendance-uuid');

      expect(attendanceRepository.remove).toHaveBeenCalledWith(mockAttendance);
    });
  });

  describe('bulkCreate', () => {
    let mockManager: {
      find: jest.Mock;
      save: jest.Mock;
    };

    beforeEach(() => {
      mockManager = {
        find: jest.fn(),
        save: jest.fn(),
      };
      Object.defineProperty(attendanceRepository, 'manager', {
        value: {
          transaction: jest.fn(
            (
              callback: (manager: typeof mockManager) => Promise<Attendance[]>,
            ) => callback(mockManager),
          ),
        },
        writable: true,
        configurable: true,
      });
    });

    it('should create attendance records for all enrolled students', async () => {
      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      classService.findOne.mockResolvedValue(mockClass);
      mockManager.find.mockResolvedValue([]);
      attendanceRepository.create.mockImplementation(
        (data) => data as Attendance,
      );
      mockManager.save.mockResolvedValue([mockAttendance, mockAttendance]);

      const result = await service.bulkCreate('session-uuid');

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(attendanceRepository.manager.transaction).toHaveBeenCalled();
      expect(mockManager.find).toHaveBeenCalledWith(Attendance, {
        where: { session: { id: 'session-uuid' } },
        relations: ['student'],
      });
      expect(mockManager.save).toHaveBeenCalledWith(
        Attendance,
        expect.arrayContaining([
          expect.objectContaining({
            status: AttendanceStatus.PENDING,
            isEnrolledClass: true,
          }),
        ]),
      );
      // Verificar que o segundo argumento é um array com 2 elementos
      const saveCall = mockManager.save.mock.calls[0] as unknown[];
      expect(saveCall[1] as Attendance[]).toHaveLength(2);
    });

    it('should throw error if session is inactive', async () => {
      const inactiveSession = { ...mockClassSession, isActive: false };
      classSessionsService.findOne.mockResolvedValue(inactiveSession);

      await expect(service.bulkCreate('session-uuid')).rejects.toThrow(
        'Cannot record attendance for an inactive class session',
      );
      expect(attendanceRepository.manager.transaction).toHaveBeenCalled();
    });

    it('should throw error if no students enrolled', async () => {
      const classWithoutStudents = { ...mockClass, enrolledStudents: [] };
      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      classService.findOne.mockResolvedValue(classWithoutStudents);

      await expect(service.bulkCreate('session-uuid')).rejects.toThrow(
        'No students enrolled in the class to record attendance for',
      );
    });

    it('should not create duplicate attendance records', async () => {
      const existingAttendances = [
        { ...mockAttendance, student: mockStudent },
        { ...mockAttendance, student: mockStudent2 },
      ];

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      classService.findOne.mockResolvedValue(mockClass);
      mockManager.find.mockResolvedValue(existingAttendances);

      const result = await service.bulkCreate('session-uuid');

      expect(result).toEqual([]);
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should only create attendances for new students', async () => {
      const existingAttendances = [
        { ...mockAttendance, student: mockStudent }, // Já existe
      ];

      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      classService.findOne.mockResolvedValue(mockClass);
      mockManager.find.mockResolvedValue(existingAttendances);
      attendanceRepository.create.mockImplementation(
        (data) => data as Attendance,
      );
      mockManager.save.mockResolvedValue([mockAttendance]);

      const result = await service.bulkCreate('session-uuid');

      expect(result).toHaveLength(1);
      // Verificar que save foi chamado com o array correto
      const saveCall = mockManager.save.mock.calls[0] as unknown[];
      expect(saveCall[0]).toBe(Attendance);
      expect(saveCall[1] as Attendance[]).toHaveLength(1);
      expect((saveCall[1] as Attendance[])[0]).toMatchObject({
        student: mockStudent2,
        isEnrolledClass: true,
        status: AttendanceStatus.PENDING,
      });
    });

    it('should create attendances with PENDING status and null checkedInAt', async () => {
      classSessionsService.findOne.mockResolvedValue(mockClassSession);
      classService.findOne.mockResolvedValue(mockClass);
      mockManager.find.mockResolvedValue([]);
      attendanceRepository.create.mockImplementation(
        (data) => data as Attendance,
      );
      mockManager.save.mockResolvedValue([mockAttendance]);

      await service.bulkCreate('session-uuid');

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AttendanceStatus.PENDING,
          isEnrolledClass: true,
          checkedInAt: null,
        }),
      );
    });
  });
});
