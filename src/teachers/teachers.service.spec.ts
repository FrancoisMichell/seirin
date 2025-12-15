import { TestBed } from '@suites/unit';
import { TeachersService } from './teachers.service';

describe('TeacherService', () => {
  let service: TeachersService;

  beforeAll(async () => {
    const { unit } = await TestBed.solitary(TeachersService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByRegistry', () => {
    it('should return a teacher by registry', () => {
      const teacher = service.findByRegistry('123321');
      expect(teacher).toBeDefined();
      expect(teacher?.registry).toBe('123321');
      expect(teacher?.id).toBe(1);
    });

    it('should return undefined for non-existing registry', () => {
      const teacher = service.findByRegistry('nonexistent');
      expect(teacher).toBeUndefined();
    });
  });

  describe('validateCredentials', () => {
    it('should return teacher data without password for valid credentials', () => {
      const result = service.validateCredentials('123321', 'teste123');
      expect(result).toBeDefined();
      expect(result).toEqual({ id: 1, registry: '123321' });
    });

    it('should return null for invalid registry', () => {
      const result = service.validateCredentials('wrongRegistry', 'teste123');
      expect(result).toBeNull();
    });

    it('should return null for invalid password', () => {
      const result = service.validateCredentials('123321', 'wrongPassword');
      expect(result).toBeNull();
    });
  });
});
