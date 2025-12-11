import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Belt } from '../common/enums';

describe('StudentsService', () => {
  let service: StudentsService;
  let mockRepository: Partial<Record<keyof Repository<Student>, jest.Mock>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      insert: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getRepositoryToken(Student),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new student', async () => {
      const createStudentDto = { name: 'John Doe', belt: Belt.White };
      const createdStudent = { id: '1', ...createStudentDto };

      mockRepository.create!.mockReturnValue(createdStudent);
      mockRepository.insert!.mockResolvedValue(createdStudent);

      const result = await service.create(createStudentDto);
      expect(mockRepository.create).toHaveBeenCalledWith(createStudentDto);
      expect(mockRepository.insert).toHaveBeenCalledWith(createdStudent);
      expect(result).toEqual(createdStudent);
    });

    it('should create and return a new student with birthday and trainingSince fields', async () => {
      const createStudentDto = {
        name: 'Jane Doe',
        belt: Belt.Blue,
        birthday: new Date('2000-01-01'),
        trainingSince: new Date('2020-01-01'),
      };
      const createdStudent = { id: '2', ...createStudentDto };
      mockRepository.create!.mockReturnValue(createdStudent);
      mockRepository.insert!.mockResolvedValue(createdStudent);

      const result = await service.create(createStudentDto);
      expect(mockRepository.create).toHaveBeenCalledWith(createStudentDto);
      expect(mockRepository.insert).toHaveBeenCalledWith(createdStudent);
      expect(result).toEqual(createdStudent);
    });

    it('should throw an error if creation fails', async () => {
      const createStudentDto = { name: 'John Doe', belt: Belt.White };
      mockRepository.create!.mockReturnValue(createStudentDto);
      mockRepository.insert!.mockRejectedValue(new Error('Creation failed'));
      await expect(service.create(createStudentDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of students', async () => {
      const students = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Doe' },
      ];
      mockRepository.find!.mockResolvedValue(students);

      const result = await service.findAll();
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(students);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array if no students found', async () => {
      mockRepository.find!.mockResolvedValue([]);
      const result = await service.findAll();
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const student = { id: '1', name: 'John Doe' };
      mockRepository.findOneBy!.mockResolvedValue(student);

      const result = await service.findOne('1');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual(student);
    });

    it('should throw NotFoundException if student not found', async () => {
      mockRepository.findOneBy!.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('update', () => {
    it('should update and return the updated student', async () => {
      const updateStudentDto = { name: 'John Smith' };
      const updatedStudent = { id: '1', name: 'John Smith' };
      mockRepository.update!.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOneBy!.mockResolvedValue(updatedStudent);
      const result = await service.update('1', updateStudentDto);

      expect(mockRepository.update).toHaveBeenCalledWith('1', updateStudentDto);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual(updatedStudent);
    });

    it('should throw NotFoundException if student to update not found', async () => {
      const updateStudentDto = { name: 'John Smith' };
      mockRepository.update!.mockResolvedValue({ affected: 0 } as any);
      await expect(service.update('1', updateStudentDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateStudentDto);
    });
  });
});
