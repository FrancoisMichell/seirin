import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { UserRoleType, DayOfWeek } from 'src/common/enums';
import { User } from 'src/users/entities/user.entity';
import { Class } from './entities/class.entity';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: Mocked<ClassesService>;

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

  beforeEach(async () => {
    const { unit, unitRef } =
      await TestBed.solitary(ClassesController).compile();

    controller = unit;
    service = unitRef.get(ClassesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct parameters', async () => {
      const createClassDto = {
        name: 'Iniciantes -  Segunda 18h',
        days: [1, 3],
        startTime: '18:00',
        durationMinutes: 60,
        teacherId: mockTeacher.id,
      };

      service.create.mockResolvedValue(mockClass);

      const result = await controller.create(createClassDto);

      expect(service.create).toHaveBeenCalledWith(createClassDto);
      expect(result).toBe(mockClass);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with correct parameters', async () => {
      service.findAll.mockResolvedValue([mockClass]);

      const result = await controller.findAll({});
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockClass]);

      const resultWithInactive = await controller.findAll({
        includeInactive: true,
      });
      expect(service.findAll).toHaveBeenCalledWith(true);
      expect(resultWithInactive).toEqual([mockClass]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with correct parameters', async () => {
      service.findOne.mockResolvedValue(mockClass);

      const result = await controller.findOne(mockClass.id);

      expect(service.findOne).toHaveBeenCalledWith(mockClass.id);
      expect(result).toBe(mockClass);
    });
  });

  describe('update', () => {
    it('should call service.update with correct parameters', async () => {
      const updateClassDto = { name: 'Avançados - Quarta 19h' };
      service.update.mockResolvedValue({ ...mockClass, ...updateClassDto });

      const result = await controller.update(mockClass.id, updateClassDto);

      expect(service.update).toHaveBeenCalledWith(mockClass.id, updateClassDto);
      expect(result).toEqual({ ...mockClass, ...updateClassDto });
    });
  });

  describe('deactivate', () => {
    it('should call service.deactivate with correct parameters', async () => {
      service.deactivate.mockResolvedValue({ ...mockClass, isActive: false });

      const result = await controller.deactivate(mockClass.id);

      expect(service.deactivate).toHaveBeenCalledWith(mockClass.id);
      expect(result).toEqual({ ...mockClass, isActive: false });
    });
  });

  describe('activate', () => {
    it('should call service.activate with correct parameters', async () => {
      service.activate.mockResolvedValue({ ...mockClass, isActive: true });
      const result = await controller.activate(mockClass.id);

      expect(service.activate).toHaveBeenCalledWith(mockClass.id);
      expect(result).toEqual({ ...mockClass, isActive: true });
    });
  });

  describe('enrollStudent', () => {
    it('should call service.enrollStudent with correct parameters', async () => {
      service.enrollStudent.mockResolvedValue({
        ...mockClass,
        enrolledStudents: [mockStudent],
      });

      const result = await controller.enrollStudent(
        mockClass.id,
        mockStudent.id,
      );

      expect(service.enrollStudent).toHaveBeenCalledWith(
        mockClass.id,
        mockStudent.id,
      );
      expect(result).toEqual({
        ...mockClass,
        enrolledStudents: [mockStudent],
      });
    });
  });

  describe('unenrollStudent', () => {
    it('should call service.unenrollStudent with correct parameters', async () => {
      service.unenrollStudent.mockResolvedValue(mockClass);

      const result = await controller.unenrollStudent(
        mockClass.id,
        mockStudent.id,
      );

      expect(service.unenrollStudent).toHaveBeenCalledWith(
        mockClass.id,
        mockStudent.id,
      );
      expect(result).toEqual(mockClass);
    });
  });
});
