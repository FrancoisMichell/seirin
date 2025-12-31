// src/attendances/attendances.controller.spec.ts

import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { Mocked, TestBed } from '@suites/unit';
import { Attendance } from './entities/attendance.entity';
import { AttendanceStatus, DayOfWeek } from 'src/common/enums';
import { ClassSession } from 'src/class-sessions/entities/class-session.entity';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';
import { PaginatedResponse } from 'src/common/interfaces';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

describe('AttendancesController', () => {
  let controller: AttendancesController;
  let service: Mocked<AttendancesService>;

  const mockStudent: User = {
    id: 'student-uuid',
    name: 'Jane Student',
    isActive: true,
  } as User;

  const mockClass: Class = {
    id: 'class-uuid',
    name: 'Iniciantes - Segunda 18h',
    days: [DayOfWeek.MONDAY],
    isActive: true,
  } as Class;

  const mockSession: ClassSession = {
    id: 'session-uuid',
    date: new Date('2024-01-15'),
    class: mockClass,
    isActive: true,
  } as ClassSession;

  const mockAttendance: Attendance = {
    id: 'attendance-uuid',
    session: mockSession,
    student: mockStudent,
    status: AttendanceStatus.PRESENT,
    isEnrolledClass: true,
    checkedInAt: new Date(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(
      AttendancesController,
    ).compile();
    controller = unit;
    service = unitRef.get(AttendancesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an attendance record', async () => {
      const createDto = {
        sessionId: 'session-uuid',
        studentId: 'student-uuid',
        status: AttendanceStatus.PRESENT,
      };

      service.create.mockResolvedValue(mockAttendance);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('findAll', () => {
    it('should return all attendances', async () => {
      service.findAll.mockResolvedValue([mockAttendance]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockAttendance]);
    });
  });

  describe('findOne', () => {
    it('should return a single attendance', async () => {
      service.findOne.mockResolvedValue(mockAttendance);

      const result = await controller.findOne('attendance-uuid');

      expect(service.findOne).toHaveBeenCalledWith('attendance-uuid');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('update', () => {
    it('should update an attendance', async () => {
      const updateDto = {
        notes: 'Updated notes',
      };
      const updatedAttendance = { ...mockAttendance, notes: 'Updated notes' };

      service.update.mockResolvedValue(updatedAttendance);

      const result = await controller.update('attendance-uuid', updateDto);

      expect(service.update).toHaveBeenCalledWith('attendance-uuid', updateDto);
      expect(result).toEqual(updatedAttendance);
    });
  });

  describe('remove', () => {
    it('should remove an attendance', async () => {
      service.remove.mockResolvedValue(mockAttendance);

      const result = await controller.remove('attendance-uuid');

      expect(service.remove).toHaveBeenCalledWith('attendance-uuid');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('bulkCreate', () => {
    it('should create attendance records for all enrolled students', async () => {
      const attendances = [mockAttendance];
      service.bulkCreate.mockResolvedValue(attendances);

      const result = await controller.bulkCreate('session-uuid');

      expect(service.bulkCreate).toHaveBeenCalledWith('session-uuid');
      expect(result).toEqual(attendances);
    });
  });

  describe('findBySession', () => {
    it('should return attendances for a session', async () => {
      const attendances = [mockAttendance];
      service.findBySession.mockResolvedValue(attendances);

      const result = await controller.findBySession('session-uuid');

      expect(service.findBySession).toHaveBeenCalledWith('session-uuid');
      expect(result).toEqual(attendances);
    });
  });

  describe('findByStudent', () => {
    it('should return paginated attendances for a student', async () => {
      const paginatedResponse: PaginatedResponse<Attendance> = {
        data: [mockAttendance],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      service.findByStudent.mockResolvedValue(paginatedResponse);

      const query: QueryAttendanceDto = { page: 1, limit: 10 };

      const result = await controller.findByStudent('student-uuid', query);

      expect(service.findByStudent).toHaveBeenCalledWith('student-uuid', 1, 10);
      expect(result).toEqual(paginatedResponse);
    });

    it('should use default pagination values when not provided', async () => {
      const paginatedResponse: PaginatedResponse<Attendance> = {
        data: [mockAttendance],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      service.findByStudent.mockResolvedValue(paginatedResponse);

      const query = new QueryAttendanceDto();

      const result = await controller.findByStudent('student-uuid', query);

      expect(service.findByStudent).toHaveBeenCalledWith('student-uuid', 1, 10);
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('markPresent', () => {
    it('should mark attendance as present', async () => {
      service.markPresent.mockResolvedValue(mockAttendance);

      const result = await controller.markPresent('attendance-uuid');

      expect(service.markPresent).toHaveBeenCalledWith('attendance-uuid');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('markLate', () => {
    it('should mark attendance as late', async () => {
      service.markLate.mockResolvedValue(mockAttendance);

      const result = await controller.markLate('attendance-uuid');

      expect(service.markLate).toHaveBeenCalledWith('attendance-uuid');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('markAbsent', () => {
    it('should mark attendance as absent', async () => {
      service.markAbsent.mockResolvedValue(mockAttendance);

      const result = await controller.markAbsent('attendance-uuid');

      expect(service.markAbsent).toHaveBeenCalledWith('attendance-uuid');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('markExcused', () => {
    it('should mark attendance as excused', async () => {
      service.markExcused.mockResolvedValue(mockAttendance);

      const result = await controller.markExcused('attendance-uuid');

      expect(service.markExcused).toHaveBeenCalledWith('attendance-uuid');
      expect(result).toEqual(mockAttendance);
    });
  });
});
