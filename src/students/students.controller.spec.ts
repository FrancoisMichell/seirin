import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Belt } from '../common/enums';

describe('StudentsController', () => {
  let controller: StudentsController;

  const mockStudentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a student', async () => {
      const createStudentDto: CreateStudentDto = {
        name: 'John Doe',
        belt: Belt.WHITE,
      };
      const createdStudent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStudentsService.create.mockResolvedValue(createdStudent);

      const result = await controller.create(createStudentDto);

      expect(mockStudentsService.create).toHaveBeenCalledWith(createStudentDto);
      expect(result).toEqual(createdStudent);
    });
  });

  describe('findAll', () => {
    it('should return an array of students', async () => {
      const students = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Jane Smith',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockStudentsService.findAll.mockResolvedValue(students);

      const result = await controller.findAll({});

      expect(mockStudentsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(students);
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440000';
      const student = {
        id: studentId,
        name: 'John Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStudentsService.findOne.mockResolvedValue(student);

      const result = await controller.findOne(studentId);

      expect(mockStudentsService.findOne).toHaveBeenCalledWith(studentId);
      expect(result).toEqual(student);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440000';
      const updateStudentDto: UpdateStudentDto = { name: 'Jane Doe' };
      const updatedStudent = {
        id: studentId,
        name: 'Jane Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStudentsService.update.mockResolvedValue(updatedStudent);

      const result = await controller.update(studentId, updateStudentDto);

      expect(mockStudentsService.update).toHaveBeenCalledWith(
        studentId,
        updateStudentDto,
      );
      expect(result).toEqual(updatedStudent);
    });
  });
});
