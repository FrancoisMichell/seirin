import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { UsersService } from '../src/users/users.service';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/users/entities/user.entity';
import {
  UserRoleType,
  AttendanceStatus,
  DayOfWeek,
  Belt,
} from '../src/common/enums';
import { createTestApp, setupTestDatabase, teardownTestApp } from './setup-e2e';
import { getBody, getBodyArray } from './helpers/response-helper';
import { Class, ClassSession, Attendance } from './types/api-responses';

describe('Attendances (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let usersService: UsersService;
  let authService: AuthService;

  let teacherToken: string;
  let teacher: User;
  let student1: User;
  let student2: User;
  let student3: User;
  let classId: string;
  let sessionId: string;

  beforeAll(async () => {
    const testContext = await createTestApp();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    app = testContext.app;
    dataSource = testContext.dataSource;

    usersService = testContext.module.get<UsersService>(UsersService);
    authService = testContext.module.get<AuthService>(AuthService);

    await setupTestDatabase(dataSource);

    // Create a teacher user (cannot be created via API)
    teacher = (await usersService.create(
      {
        registry: 'TEACHER001',
        password: 'Teacher@123',
        name: 'John Sensei',
        birthday: new Date('1985-03-15'),
        trainingSince: new Date('2010-01-01'),
      },
      [UserRoleType.TEACHER],
    )) as User;

    // Login as teacher to get token
    const loginResponse = await authService.login(teacher);
    teacherToken = loginResponse.token;

    // Create students for testing
    const studentResponse1 = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        registry: 'STU001',
        name: 'Alice Student',
        belt: Belt.White,
        birthday: '2010-05-10',
        trainingSince: '2020-01-15',
      });
    student1 = getBody<User>(studentResponse1);

    const studentResponse2 = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        registry: 'STU002',
        name: 'Bob Student',
        belt: Belt.White,
        birthday: '2011-08-20',
        trainingSince: '2020-03-10',
      });
    student2 = getBody<User>(studentResponse2);

    const studentResponse3 = await request(app.getHttpServer())
      .post('/students')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        registry: 'STU003',
        name: 'Charlie Student',
        belt: Belt.White,
        birthday: '2012-12-30',
        trainingSince: '2021-06-01',
      });
    student3 = getBody<User>(studentResponse3);

    // Create a class
    const classResponse = await request(app.getHttpServer())
      .post('/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Kids Martial Arts',
        days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
        startTime: '18:00',
        durationMinutes: 60,
        teacherId: teacher.id,
      });
    classId = getBody<Class>(classResponse).id;

    // Enroll students in the class
    await request(app.getHttpServer())
      .post(`/classes/${classId}/enroll`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ studentId: student1.id });

    await request(app.getHttpServer())
      .post(`/classes/${classId}/enroll`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ studentId: student2.id });

    // Create a class session
    const sessionResponse = await request(app.getHttpServer())
      .post('/class-sessions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId,
        teacherId: teacher.id,
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '19:00',
        notes: 'Test session for attendance',
      });
    sessionId = getBody<ClassSession>(sessionResponse).id;
  }, 60000);

  afterAll(async () => {
    await teardownTestApp(app, dataSource);
  }, 30000);

  describe('Authentication & Authorization', () => {
    it('should reject requests without token', () => {
      return request(app.getHttpServer()).get('/attendances').expect(401);
    });

    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .get('/attendances')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should allow authenticated teacher to access', () => {
      return request(app.getHttpServer())
        .get('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });

  describe('POST /attendances (Create)', () => {
    let attendanceId: string;

    it('should create a new attendance record', async () => {
      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
          status: AttendanceStatus.PENDING,
          notes: 'Test attendance creation',
        })
        .expect(201);

      const attendance = getBody<Attendance>(response);
      attendanceId = attendance.id;

      expect(attendance).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(String),
        status: AttendanceStatus.PENDING,
        notes: 'Test attendance creation',
      });
      // isEnrolledClass is calculated based on class enrollment
      expect(attendance.isEnrolledClass).toBeDefined();
      expect(attendance.checkedInAt).toBeNull();
      expect(attendance.session).toBeDefined();
      expect(attendance.student).toBeDefined();
    });

    it('should create attendance without optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student2.id,
        })
        .expect(201);

      const attendance = getBody<Attendance>(response);
      // Backend defaults to PRESENT status when not specified
      expect(attendance).toMatchObject({
        status: AttendanceStatus.PRESENT,
        notes: null,
      });
      expect(attendance.checkedInAt).toBeTruthy();
    });

    it('should fail with invalid sessionId format', () => {
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: 'invalid-uuid',
          studentId: student1.id,
        })
        .expect(400);
    });

    it('should fail with invalid studentId format', () => {
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: 'invalid-uuid',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          // missing studentId
        })
        .expect(400);
    });

    it('should fail with non-existent sessionId', () => {
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: '00000000-0000-0000-0000-000000000000',
          studentId: student1.id,
        })
        .expect(404);
    });

    it('should fail with non-existent studentId', () => {
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });

    it('should fail with invalid status enum', () => {
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });

    it('should prevent duplicate attendance for same student in same session', async () => {
      // First attendance should succeed
      await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student3.id,
        })
        .expect(201);

      // Duplicate should fail
      return request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student3.id,
        })
        .expect(400);
    });

    // Cleanup this test's created attendance
    afterAll(async () => {
      if (attendanceId) {
        await request(app.getHttpServer())
          .delete(`/attendances/${attendanceId}`)
          .set('Authorization', `Bearer ${teacherToken}`);
      }
    });
  });

  describe('POST /attendances/bulk/:sessionId (Bulk Create)', () => {
    let bulkSessionId: string;

    beforeAll(async () => {
      // Create a new session for bulk testing
      const sessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 518400000).toISOString().split('T')[0], // +6 days (Wednesday)
          startTime: '18:00',
          endTime: '19:00',
          notes: 'Bulk attendance test session',
        });
      bulkSessionId = getBody<ClassSession>(sessionResponse).id;
    }, 10000);

    it('should create attendance for all enrolled students', async () => {
      const response = await request(app.getHttpServer())
        .post(`/attendances/bulk/${bulkSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      const attendances = getBody<Attendance[]>(response);
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBe(2); // student1 and student2 are enrolled

      attendances.forEach((attendance) => {
        expect(attendance).toMatchObject({
          id: expect.any(String) as string,
          status: AttendanceStatus.PENDING,
          isEnrolledClass: true,
        });
      });
    });

    it('should fail with invalid sessionId format', () => {
      return request(app.getHttpServer())
        .post('/attendances/bulk/invalid-uuid')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should fail with non-existent sessionId', () => {
      return request(app.getHttpServer())
        .post('/attendances/bulk/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should fail when attendances already exist for session', () => {
      return request(app.getHttpServer())
        .post(`/attendances/bulk/${bulkSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });
  });

  describe('GET /attendances (Find All with Filters)', () => {
    it('should return all attendances', async () => {
      const response = await request(app.getHttpServer())
        .get('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBeGreaterThan(0);
    });

    it('should filter by sessionId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances?sessionId=${sessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      attendances.forEach((attendance) => {
        expect(attendance.session.id).toBe(sessionId);
      });
    });

    it('should filter by studentId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances?studentId=${student1.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      attendances.forEach((attendance) => {
        expect(attendance.student.id).toBe(student1.id);
      });
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances?status=${AttendanceStatus.PENDING}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      attendances.forEach((attendance) => {
        expect(attendance.status).toBe(AttendanceStatus.PENDING);
      });
    });

    it('should filter by isEnrolledClass', async () => {
      const response = await request(app.getHttpServer())
        .get('/attendances?isEnrolledClass=true')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      attendances.forEach((attendance) => {
        expect(attendance.isEnrolledClass).toBe(true);
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/attendances?sessionId=${sessionId}&status=${AttendanceStatus.PENDING}&isEnrolledClass=true`,
        )
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/attendances?sessionId=${sessionId}&status=${AttendanceStatus.EXCUSED}`,
        )
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      // Should be empty since we haven't marked anyone as excused yet
      expect(attendances.length).toBe(0);
    });
  });

  describe('GET /attendances/session/:sessionId (Find By Session)', () => {
    it('should return all attendances for a session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances/session/${sessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBeGreaterThan(0);
      // findBySession only returns student relation, not session
      attendances.forEach((attendance) => {
        expect(attendance.student).toBeDefined();
      });
    });

    it('should fail with invalid sessionId format', () => {
      return request(app.getHttpServer())
        .get('/attendances/session/invalid-uuid')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should return empty array for session with no attendances', async () => {
      // Create a new session without attendances
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 950400000).toISOString().split('T')[0], // +11 days (Monday)
          startTime: '18:00',
          endTime: '19:00',
        });

      const newSession = getBody<ClassSession>(newSessionResponse);
      const response = await request(app.getHttpServer())
        .get(`/attendances/session/${newSession.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBe(0);
    });
  });

  describe('GET /attendances/student/:studentId (Find By Student)', () => {
    it('should return all attendances for a student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances/student/${student1.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // findByStudent returns array directly, not paginated object
      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      attendances.forEach((attendance) => {
        expect(attendance.student.id).toBe(student1.id);
      });
    });

    it('should support pagination with page parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances/student/${student1.id}?page=1&limit=5`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Returns array with max 5 items
      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBeLessThanOrEqual(5);
    });

    it('should support pagination with custom limit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances/student/${student1.id}?limit=2`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Returns array with max 2 items
      const attendances = getBodyArray<Attendance>(response);
      expect(Array.isArray(attendances)).toBe(true);
      expect(attendances.length).toBeLessThanOrEqual(2);
    });

    it('should fail with invalid studentId format', () => {
      return request(app.getHttpServer())
        .get('/attendances/student/invalid-uuid')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should fail with invalid page number', () => {
      return request(app.getHttpServer())
        .get(`/attendances/student/${student1.id}?page=invalid`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should fail with invalid limit number', () => {
      return request(app.getHttpServer())
        .get(`/attendances/student/${student1.id}?limit=invalid`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });
  });

  describe('GET /attendances/:id (Find One)', () => {
    let testAttendanceId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
          notes: 'Test for find one',
        });
      testAttendanceId = getBody<Attendance>(response).id;
    }, 10000);

    it('should return a single attendance by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance).toMatchObject({
        id: testAttendanceId,
        notes: 'Test for find one',
      });
      expect(attendance.session).toBeDefined();
      expect(attendance.student).toBeDefined();
    });

    it('should fail with invalid id format', () => {
      return request(app.getHttpServer())
        .get('/attendances/invalid-uuid')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .get('/attendances/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    afterAll(async () => {
      await request(app.getHttpServer())
        .delete(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });
  });

  describe('PATCH /attendances/:id (Update)', () => {
    let testAttendanceId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
        });
      testAttendanceId = getBody<Attendance>(response).id;
    }, 10000);

    it('should update attendance notes', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          notes: 'Updated notes',
        })
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.notes).toBe('Updated notes');
    });

    it('should update attendance status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: AttendanceStatus.PRESENT,
        })
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.PRESENT);
      expect(attendance.checkedInAt).toBeTruthy();
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: AttendanceStatus.LATE,
          notes: 'Arrived 10 minutes late',
        })
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.LATE);
      expect(attendance.notes).toBe('Arrived 10 minutes late');
    });

    it('should fail with invalid id format', () => {
      return request(app.getHttpServer())
        .patch('/attendances/invalid-uuid')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ notes: 'Test' })
        .expect(400);
    });

    it('should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/attendances/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ notes: 'Test' })
        .expect(404);
    });

    it('should fail with invalid status enum', () => {
      return request(app.getHttpServer())
        .patch(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should strip unknown fields with forbidNonWhitelisted', async () => {
      // With forbidNonWhitelisted: true, unknown fields cause 400
      await request(app.getHttpServer())
        .patch(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          notes: 'Valid field',
          unknownField: 'Should cause error',
        })
        .expect(400);

      // But valid fields work fine
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          notes: 'Valid field only',
        })
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.notes).toBe('Valid field only');
    });

    afterAll(async () => {
      await request(app.getHttpServer())
        .delete(`/attendances/${testAttendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });
  });

  describe('PATCH /attendances/:id/mark-* (Status Shortcuts)', () => {
    let attendanceIds: {
      present: string;
      late: string;
      absent: string;
      excused: string;
    };
    let markTestSessionId: string;

    beforeAll(async () => {
      // Create a dedicated session for mark-* tests to avoid duplicate attendances
      const markSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          startTime: '18:00',
          endTime: '19:00',
          notes: 'Mark status tests session',
        });
      markTestSessionId = getBody<ClassSession>(markSessionResponse).id;

      // Create attendances for each status test with PENDING status
      const createAttendance = async (studentId: string) => {
        const response = await request(app.getHttpServer())
          .post('/attendances')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            sessionId: markTestSessionId,
            studentId,
            status: AttendanceStatus.PENDING,
          });
        return getBody<Attendance>(response).id;
      };

      attendanceIds = {
        present: await createAttendance(student1.id),
        late: await createAttendance(student2.id),
        absent: await createAttendance(student3.id),
        excused: await createAttendance(student1.id),
      };

      // For the excused test, create a separate session
      const excusedSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          startTime: '18:00',
          endTime: '19:00',
        });

      const excusedAttendanceResponse = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: getBody<ClassSession>(excusedSessionResponse).id,
          studentId: student2.id,
          status: AttendanceStatus.PENDING,
        });
      attendanceIds.excused = getBody<Attendance>(excusedAttendanceResponse).id;
    }, 10000);

    it('should mark attendance as present', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${attendanceIds.present}/mark-present`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.PRESENT);
      expect(attendance.checkedInAt).toBeTruthy();
    });

    it('should mark attendance as late', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${attendanceIds.late}/mark-late`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.LATE);
      expect(attendance.checkedInAt).toBeTruthy();
    });

    it('should mark attendance as absent', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${attendanceIds.absent}/mark-absent`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.ABSENT);
      expect(attendance.checkedInAt).toBeNull();
    });

    it('should mark attendance as excused', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/attendances/${attendanceIds.excused}/mark-excused`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.EXCUSED);
      expect(attendance.checkedInAt).toBeNull();
    });

    it('should fail mark-present with invalid id', () => {
      return request(app.getHttpServer())
        .patch('/attendances/invalid-uuid/mark-present')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should fail mark-late with non-existent id', () => {
      return request(app.getHttpServer())
        .patch('/attendances/00000000-0000-0000-0000-000000000000/mark-late')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should allow changing status multiple times', async () => {
      const id = attendanceIds.present;

      // Mark as late
      let response = await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-late`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      let attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.LATE);

      // Then mark as present
      response = await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-present`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.PRESENT);

      // Then mark as absent
      response = await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-absent`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      attendance = getBody<Attendance>(response);
      expect(attendance.status).toBe(AttendanceStatus.ABSENT);
      expect(attendance.checkedInAt).toBeNull();
    });

    afterAll(async () => {
      // Cleanup
      if (attendanceIds) {
        for (const id of Object.values(attendanceIds)) {
          await request(app.getHttpServer())
            .delete(`/attendances/${id}`)
            .set('Authorization', `Bearer ${teacherToken}`);
        }
      }
    });
  });

  describe('DELETE /attendances/:id (Remove)', () => {
    it('should delete an attendance', async () => {
      // Create attendance to delete
      const createResponse = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
        });

      const id = getBody<Attendance>(createResponse).id;

      // Delete it
      await request(app.getHttpServer())
        .delete(`/attendances/${id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/attendances/${id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should fail with invalid id format', () => {
      return request(app.getHttpServer())
        .delete('/attendances/invalid-uuid')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should fail with non-existent id', () => {
      return request(app.getHttpServer())
        .delete('/attendances/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should not allow deleting same attendance twice', async () => {
      // Create attendance
      const createResponse = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
        });

      const id = getBody<Attendance>(createResponse).id;

      // First delete should succeed
      await request(app.getHttpServer())
        .delete(`/attendances/${id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Second delete should fail
      await request(app.getHttpServer())
        .delete(`/attendances/${id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });
  });

  describe('Edge Cases & Complex Scenarios', () => {
    it('should handle non-enrolled student attendance (guest)', async () => {
      // Create a new session for this test
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 1728000000).toISOString().split('T')[0], // +20 days (Wednesday)
          startTime: '18:00',
          endTime: '19:00',
        });

      // student3 is not enrolled in the class
      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: getBody<ClassSession>(newSessionResponse).id,
          studentId: student3.id,
        })
        .expect(201);

      const attendance = getBody<Attendance>(response);
      expect(attendance.isEnrolledClass).toBe(false);
    });

    it('should handle concurrent attendance creation', async () => {
      // Create new session
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 1123200000).toISOString().split('T')[0], // +13 days (Wednesday)
          startTime: '18:00',
          endTime: '19:00',
        });
      const newSessionId = getBody<ClassSession>(newSessionResponse).id;

      // Try to create multiple attendances concurrently
      const promises = [
        request(app.getHttpServer())
          .post('/attendances')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            sessionId: newSessionId,
            studentId: student1.id,
            status: AttendanceStatus.PENDING,
          }),
        request(app.getHttpServer())
          .post('/attendances')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            sessionId: newSessionId,
            studentId: student2.id,
            status: AttendanceStatus.PENDING,
          }),
        request(app.getHttpServer())
          .post('/attendances')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            sessionId: newSessionId,
            studentId: student3.id,
            status: AttendanceStatus.PENDING,
          }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe(201);
      });
    });

    it('should handle attendance for student with special characters in notes', async () => {
      const specialNotes =
        'Special notes: @#$%^&*()_+-=[]{}|;:",.<>?/~` with émojis 🎯 and line\nbreaks';

      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId,
          studentId: student1.id,
          status: AttendanceStatus.PENDING,
          notes: specialNotes,
        })
        .expect(201);

      const attendance = getBody<Attendance>(response);
      expect(attendance.notes).toBe(specialNotes);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/attendances/${attendance.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });

    it('should handle very long notes (stress test)', async () => {
      const longNotes = 'A'.repeat(5000);

      // Create new session for this test
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 2160000000).toISOString().split('T')[0], // +25 days (Monday)
          startTime: '18:00',
          endTime: '19:00',
        });

      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: getBody<ClassSession>(newSessionResponse).id,
          studentId: student1.id,
          status: AttendanceStatus.PENDING,
          notes: longNotes,
        })
        .expect(201);

      const attendance = getBody<Attendance>(response);
      expect(attendance.notes).toBe(longNotes);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/attendances/${attendance.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });

    it('should maintain referential integrity when session is deleted', async () => {
      // Create a new session
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 1555200000).toISOString().split('T')[0], // +18 days (Monday)
          startTime: '18:00',
          endTime: '19:00',
        });
      const newSessionId = getBody<ClassSession>(newSessionResponse).id;

      // Create attendance for this session
      const attendanceResponse = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: newSessionId,
          studentId: student1.id,
          status: AttendanceStatus.PENDING,
        });
      const attendanceId = getBody<Attendance>(attendanceResponse).id;

      // Delete the session (should cascade delete attendances)
      await request(app.getHttpServer())
        .delete(`/class-sessions/${newSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(204);

      // Verify attendance was cascade deleted
      await request(app.getHttpServer())
        .get(`/attendances/${attendanceId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should prevent updating to null required fields', async () => {
      // Create new session
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 2332800000).toISOString().split('T')[0], // +27 days (Wednesday)
          startTime: '18:00',
          endTime: '19:00',
        });

      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: getBody<ClassSession>(newSessionResponse).id,
          studentId: student1.id,
          status: AttendanceStatus.PENDING,
        });

      // Try to update with empty/invalid data
      await request(app.getHttpServer())
        .patch(`/attendances/${getBody<Attendance>(response).id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          status: null,
        })
        .expect(500); // TypeORM throws 500 for null constraint violation

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/attendances/${getBody<Attendance>(response).id}`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });

    it('should handle rapid status changes correctly', async () => {
      // Create new session
      const newSessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 2764800000).toISOString().split('T')[0], // +32 days (Monday)
          startTime: '18:00',
          endTime: '19:00',
        });

      const response = await request(app.getHttpServer())
        .post('/attendances')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionId: getBody<ClassSession>(newSessionResponse).id,
          studentId: student1.id,
          status: AttendanceStatus.PENDING,
        });

      const id = getBody<Attendance>(response).id;

      // Rapidly change status multiple times
      await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-present`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-late`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-absent`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const finalResponse = await request(app.getHttpServer())
        .patch(`/attendances/${id}/mark-present`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Final status should be present
      const finalAttendance = getBody<Attendance>(finalResponse);
      expect(finalAttendance.status).toBe(AttendanceStatus.PRESENT);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/attendances/${id}`)
        .set('Authorization', `Bearer ${teacherToken}`);
    });
  });

  describe('Complete Happy Path Flow', () => {
    it('should complete a full attendance workflow', async () => {
      // 1. Create a new class session
      const sessionResponse = await request(app.getHttpServer())
        .post('/class-sessions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId,
          teacherId: teacher.id,
          date: new Date(Date.now() + 2937600000).toISOString().split('T')[0], // +34 days (Wednesday)
          startTime: '18:00',
          endTime: '19:00',
          notes: 'Complete workflow test',
        })
        .expect(201);

      const workflowSessionId = getBody<ClassSession>(sessionResponse).id;

      // 2. Bulk create attendances for all enrolled students
      const bulkResponse = await request(app.getHttpServer())
        .post(`/attendances/bulk/${workflowSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(201);

      const attendances = getBodyArray<Attendance>(bulkResponse);
      expect(attendances.length).toBeGreaterThan(0);

      // 3. Mark first student as present
      await request(app.getHttpServer())
        .patch(`/attendances/${attendances[0].id}/mark-present`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // 4. Mark second student as late
      if (attendances[1]) {
        await request(app.getHttpServer())
          .patch(`/attendances/${attendances[1].id}/mark-late`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);
      }

      // 5. Get all attendances for the session
      const sessionAttendances = await request(app.getHttpServer())
        .get(`/attendances/session/${workflowSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const sessionAttendancesArray =
        getBodyArray<Attendance>(sessionAttendances);
      expect(sessionAttendancesArray.length).toBe(attendances.length);

      // 6. Get student attendance history
      const studentHistory = await request(app.getHttpServer())
        .get(`/attendances/student/${student1.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const studentHistoryArray = getBodyArray<Attendance>(studentHistory);
      expect(Array.isArray(studentHistoryArray)).toBe(true);
      expect(studentHistoryArray.length).toBeGreaterThan(0);

      // 7. Add notes to attendance
      await request(app.getHttpServer())
        .patch(`/attendances/${attendances[0].id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          notes: 'Student showed great improvement today!',
        })
        .expect(200);

      // 8. Verify final state
      const finalCheck = await request(app.getHttpServer())
        .get(`/attendances/${attendances[0].id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const finalAttendance = getBody<Attendance>(finalCheck);
      expect(finalAttendance).toMatchObject({
        status: AttendanceStatus.PRESENT,
        notes: 'Student showed great improvement today!',
      });

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/class-sessions/${workflowSessionId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(204);
    });
  });
});
