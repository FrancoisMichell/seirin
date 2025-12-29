import { TestingModule } from '@nestjs/testing';
import {
  createBaseTeacher,
  createTestApp,
  setupTestDatabase,
  teardownTestApp,
} from './setup-e2e';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Belt, UserRoleType } from 'src/common/enums';
import { UsersService } from 'src/users/users.service';
import { DataSource } from 'typeorm';
import { LoginResponse, User } from './types/api-responses';
import { getBody } from './helpers/response-helper';
import { App } from 'supertest/types';
import { CreateStudentDto } from 'src/students/dto/create-student.dto';
import { PaginatedResponse } from 'src/common/interfaces';

describe('Student e2e tests', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let usersService: UsersService;
  let authToken: string;

  let teacher: User;
  const students: User[] = [];

  beforeAll(async () => {
    ({ app, module, dataSource } = await createTestApp());
    usersService = module.get<UsersService>(UsersService);
    await setupTestDatabase(dataSource);

    teacher = await createBaseTeacher(usersService);

    const login = await request(app.getHttpServer() as App)
      .post('/teacher/login')
      .send({ username: teacher.registry, password: teacher.password })
      .expect(200);

    const loginData = getBody<LoginResponse>(login);
    authToken = loginData.token;
  });

  afterAll(async () => {
    await teardownTestApp(app, dataSource);
  }, 30000);

  describe('POST /students', () => {
    it('should create a new student with minimal data', async () => {
      const studentData = {
        name: 'John Doe',
        belt: 'Blue',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(studentData)
        .expect(201);

      const createdStudent = getBody<User>(response);
      expect(createdStudent).toHaveProperty('id');
      expect(createdStudent.name).toBe(studentData.name);
      expect(createdStudent.belt).toBe(studentData.belt);
      expect(createdStudent.registry).toBeNull();
      expect(createdStudent.birthday).toBeNull();
      expect(createdStudent.trainingSince).toBeNull();
      expect(createdStudent.isActive).toBe(true);
      expect(createdStudent.roles).toEqual([
        { id: expect.any(String) as string, role: UserRoleType.STUDENT },
      ]);
      expect(createdStudent.password).toBeUndefined();
      students.push(createdStudent);
    });

    it('should create a new student with all fields', async () => {
      const studentData = {
        name: 'Jane Smith',
        registry: '987655',
        belt: 'White',
        birthday: '2005-05-15',
        trainingSince: '2020-01-10',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(studentData)
        .expect(201);

      const createdStudent = getBody<User>(response);
      expect(createdStudent).toHaveProperty('id');
      expect(createdStudent.name).toBe(studentData.name);
      expect(createdStudent.registry).toBe(studentData.registry);
      expect(createdStudent.belt).toBe(studentData.belt);
      expect(createdStudent.birthday).toBeDefined();
      expect(createdStudent.trainingSince).toBeDefined();
      expect(createdStudent.isActive).toBe(true);
      expect(createdStudent.roles).toEqual([
        { id: expect.any(String) as string, role: UserRoleType.STUDENT },
      ]);
      expect(createdStudent.password).toBeUndefined();
      students.push(createdStudent);
    });

    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/students')
        .send({ name: 'John Doe', registry: '123456', belt: 'White' })
        .expect(401);

      const body = getBody<{ message: string }>(response);
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 403 if user is not a teacher', async () => {
      // Create a student user to test unauthorized access
      const studentUser = await usersService.create(
        {
          name: 'Student User',
          registry: '555555',
          belt: Belt.Yellow,
          password: 'studentpass',
        },
        [UserRoleType.STUDENT],
      );
      students.push(studentUser!);

      const loginResponse = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: studentUser!.registry, password: 'studentpass' })
        .expect(200);

      const studentLoginData = getBody<LoginResponse>(loginResponse);

      const response = await request(app.getHttpServer() as App)
        .post('/students')
        .set('Authorization', `Bearer ${studentLoginData.token}`)
        .send({
          name: 'Unauthorized Student',
          registry: '666666',
          belt: 'White',
        })
        .expect(403);

      const body = getBody<{ message: string }>(response);
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('Forbidden resource');
    });

    it.each`
      scenario                          | studentData                                                | expectedMessage
      ${'empty name'}                   | ${{ name: '', belt: 'White' }}                             | ${'name should not be empty'}
      ${'invalid belt enum'}            | ${{ name: 'Test', belt: 'Purple' }}                        | ${'belt must be one of the following values: White, Yellow, Orange, Green, Blue, Brown, Black'}
      ${'invalid birthday format'}      | ${{ name: 'Test', belt: 'White', birthday: '2000-13-45' }} | ${'birthday must be a Date instance'}
      ${'invalid trainingSince format'} | ${{ name: 'Test', belt: 'White', trainingSince: 'abcd' }}  | ${'trainingSince must be a Date instance'}
      ${'unknown field present'}        | ${{ name: 'Test', belt: 'White', unknownField: 'x' }}      | ${'property unknownField should not exist'}
    `(
      'should return 400 for $scenario',
      async ({ studentData, expectedMessage }) => {
        const response = await request(app.getHttpServer() as App)
          .post('/students')
          .set('Authorization', `Bearer ${authToken}`)
          .send(studentData as CreateStudentDto)
          .expect(400);

        const body = getBody<{ message: string[] }>(response);
        expect(body).toHaveProperty('message');
        expect(body.message).toContain(expectedMessage);
      },
    );

    it('should throw error when trying to create student with duplicate registry', async () => {
      const duplicateRegistry = '987655';
      const studentData = {
        name: 'Duplicate Registry',
        registry: duplicateRegistry,
        belt: 'Green',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(studentData)
        .expect(400);

      const body = getBody<{ message: string[] }>(response);
      expect(body).toHaveProperty('message');
      expect(body.message).toContain(
        `Student with registry ${duplicateRegistry} already exists`,
      );
    });
  });

  describe('GET /students', () => {
    it('should get all students without filters', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('page');
      expect(body.meta).toHaveProperty('limit');
      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('totalPages');
      expect(body.meta.total).toEqual(students.length);
      expect(body.meta.totalPages).toEqual(1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(students.length);
    });

    it('should get students with pagination', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 2, limit: 1 })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('page', 2);
      expect(body.meta).toHaveProperty('limit', 1);
      expect(body.meta).toHaveProperty('total', students.length);
      expect(body.meta).toHaveProperty(
        'totalPages',
        Math.ceil(students.length / 1),
      );
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
    });

    it('should get students filtered by name', async () => {
      const targetStudent = students[0];

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: targetStudent.name })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 1);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].id).toEqual(targetStudent.id);
    });

    it('should get students filtered by registry', async () => {
      const targetStudent = students[1];

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ registry: targetStudent.registry })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 1);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].id).toEqual(targetStudent.id);
    });

    it('should get students filtered by belt', async () => {
      const targetStudent = students[0];

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ belt: targetStudent.belt })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 1);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].id).toEqual(targetStudent.id);
    });

    it('should get students filtered by isActive status', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ isActive: true })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', students.length);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(students.length);
    });

    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .expect(401);

      const body = getBody<{ message: string }>(response);
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('Unauthorized');
    });

    it('should return 403 if user is not a teacher', async () => {
      const studentUser = students[2];
      const loginResponse = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({
          username: studentUser.registry,
          password: 'studentpass',
        })
        .expect(200);

      const studentLoginData = getBody<LoginResponse>(loginResponse);

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${studentLoginData.token}`)
        .expect(403);

      const body = getBody<{ message: string }>(response);
      expect(body).toHaveProperty('message');
      expect(body.message).toBe('Forbidden resource');
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: -1, limit: 0, belt: 'Purple' })
        .expect(400);

      const body = getBody<{ message: string[] }>(response);
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('page must not be less than 1');
      expect(body.message).toContain('limit must not be less than 1');
      expect(body.message).toContain(
        'belt must be one of the following values: White, Yellow, Orange, Green, Blue, Brown, Black',
      );
    });

    it('should return empty data for filters that match no students', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: 'Nonexistent Name' })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 0);
      expect(body.meta).toHaveProperty('totalPages', 0);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(0);
    });

    it('should handle pagination requests beyond available data', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 10, limit: 5 })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', students.length);
      expect(body.meta).toHaveProperty(
        'totalPages',
        Math.ceil(students.length / 5),
      );
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(0);
    });

    it('should handle large limit values gracefully', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 1000 })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', students.length);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(students.length);
    });
    it('should handle combined filters correctly', async () => {
      const targetStudent = students[0];

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: targetStudent.name, belt: targetStudent.belt })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 1);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].id).toEqual(targetStudent.id);
    });

    it('should be case-insensitive when filtering by name', async () => {
      const targetStudent = students[0];
      const nameFilter = targetStudent.name.toUpperCase();

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: nameFilter })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 1);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].id).toEqual(targetStudent.id);
    });

    it('should not trim whitespace in query parameters', async () => {
      const targetStudent = students[0];
      const nameFilter = `  ${targetStudent.name}  `;

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: nameFilter })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 0);
      expect(body.meta).toHaveProperty('totalPages', 0);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(0);
    });

    it('should handle special characters in name filter', async () => {
      const specialStudent = await usersService.create(
        {
          name: "Anne-Marie O'Connor",
          belt: Belt.Green,
        },
        [UserRoleType.STUDENT],
      );
      students.push(specialStudent!);

      const response = await request(app.getHttpServer() as App)
        .get('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: specialStudent!.name })
        .expect(200);

      const body = getBody<PaginatedResponse<User>>(response);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 1);
      expect(body.meta).toHaveProperty('totalPages', 1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].id).toEqual(specialStudent!.id);
    });
  });
});
