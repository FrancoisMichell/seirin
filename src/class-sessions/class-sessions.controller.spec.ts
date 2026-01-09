import { ClassSessionsController } from './class-sessions.controller';
import { ClassSessionsService } from './class-sessions.service';
import { Mocked, TestBed } from '@suites/unit';
import { ClassSession } from './entities/class-session.entity';

describe('ClassSessionsController', () => {
  let controller: ClassSessionsController;
  let sessionService: Mocked<ClassSessionsService>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(
      ClassSessionsController,
    ).compile();
    controller = unit;
    sessionService = unitRef.get(ClassSessionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct parameters', async () => {
      const createClassSessionDto = {
        classId: 'class-uuid',
        teacherId: 'teacher-uuid',
        date: new Date('2024-10-10T10:00:00Z'),
      };
      const mockSession = {
        id: 'session-uuid',
        ...createClassSessionDto,
      } as unknown as ClassSession;

      sessionService.create.mockResolvedValue(mockSession);

      const result = await controller.create(createClassSessionDto);

      expect(sessionService.create).toHaveBeenCalledWith(createClassSessionDto);
      expect(result).toBe(mockSession);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with correct parameters', async () => {
      const filters = {};

      const mockSession = {
        id: 'session-uuid',
        date: new Date('2024-10-10T10:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.findAll.mockResolvedValue([mockSession]);

      const result = await controller.findAll(filters);

      expect(sessionService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockSession]);
    });
  });

  describe('findByClass', () => {
    it('should call service.findByClass with correct parameters', async () => {
      const classId = 'class-uuid';
      const includeInactive = 'true';
      const mockSession = {
        id: 'session-uuid',
        date: new Date('2024-10-10T10:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.findByClass.mockResolvedValue([mockSession]);

      const result = await controller.findByClass(classId, {
        includeInactive,
      });

      expect(sessionService.findByClass).toHaveBeenCalledWith(
        classId,
        includeInactive,
      );
      expect(result).toEqual([mockSession]);
    });
  });

  describe('findByTeacher', () => {
    it('should call service.findByTeacher with correct parameters', async () => {
      const teacherId = 'teacher-uuid';
      const includeInactive = 'false';
      const mockSession = {
        id: 'session-uuid',
        date: new Date('2024-10-10T10:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.findByTeacher.mockResolvedValue([mockSession]);

      const result = await controller.findByTeacher(teacherId, {
        includeInactive,
      });

      expect(sessionService.findByTeacher).toHaveBeenCalledWith(
        teacherId,
        includeInactive,
      );
      expect(result).toEqual([mockSession]);
    });
  });

  describe('findByDateRange', () => {
    it('should call service.findByDateRange with correct parameters', async () => {
      const startDate = new Date('2024-10-01T00:00:00Z');
      const endDate = new Date('2024-10-31T23:59:59Z');
      const includeInactive = 'true';
      const mockSession = {
        id: 'session-uuid',
        date: new Date('2024-10-10T10:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.findByDateRange.mockResolvedValue([mockSession]);

      const result = await controller.findByDateRange({
        startDate,
        endDate,
        includeInactive,
      });

      expect(sessionService.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
        includeInactive,
      );
      expect(result).toEqual([mockSession]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with correct parameters', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        date: new Date('2024-10-10T10:00:00Z'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.findOne.mockResolvedValue(mockSession);

      const result = await controller.findOne(sessionId);

      expect(sessionService.findOne).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(mockSession);
    });
  });

  describe('update', () => {
    it('should call service.update with correct parameters', async () => {
      const sessionId = 'session-uuid';
      const updateClassSessionDto = {
        date: new Date('2024-10-15T10:00:00Z'),
      };
      const mockSession = {
        id: sessionId,
        ...updateClassSessionDto,
      } as unknown as ClassSession;

      sessionService.update.mockResolvedValue(mockSession);

      const result = await controller.update(sessionId, updateClassSessionDto);

      expect(sessionService.update).toHaveBeenCalledWith(
        sessionId,
        updateClassSessionDto,
      );
      expect(result).toBe(mockSession);
    });
  });

  describe('activate', () => {
    it('should call service.activate with correct parameters', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        isActive: true,
        date: new Date('2024-10-10T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.activate.mockResolvedValue(mockSession);

      const result = await controller.activate(sessionId);

      expect(sessionService.activate).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(mockSession);
    });
  });

  describe('deactivate', () => {
    it('should call service.deactivate with correct parameters', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        isActive: false,
        date: new Date('2024-10-10T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.deactivate.mockResolvedValue(mockSession);

      const result = await controller.deactivate(sessionId);

      expect(sessionService.deactivate).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(mockSession);
    });
  });

  describe('remove', () => {
    it('should call service.remove with correct parameters', async () => {
      const sessionId = 'session-uuid';

      sessionService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(sessionId);

      expect(sessionService.remove).toHaveBeenCalledWith(sessionId);
      expect(result).toBeUndefined();
    });
  });

  describe('start', () => {
    it('should call service.start with correct parameters', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        isActive: false,
        date: new Date('2024-10-10T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.start.mockResolvedValue(mockSession);

      const result = await controller.start(sessionId);

      expect(sessionService.start).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(mockSession);
    });
  });

  describe('end', () => {
    it('should call service.end with correct parameters', async () => {
      const sessionId = 'session-uuid';
      const mockSession = {
        id: sessionId,
        isActive: false,
        date: new Date('2024-10-10T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as ClassSession;

      sessionService.end.mockResolvedValue(mockSession);

      const result = await controller.end(sessionId);

      expect(sessionService.end).toHaveBeenCalledWith(sessionId);
      expect(result).toBe(mockSession);
    });
  });
});
