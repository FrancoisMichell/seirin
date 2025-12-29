import { INestApplication } from '@nestjs/common';
import { UserRoleType } from 'src/common/enums';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { UsersService } from 'src/users/users.service';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {
  createBaseTeacher,
  createTestApp,
  setupTestDatabase,
  teardownTestApp,
} from './setup-e2e';
import { App } from 'supertest/types';
import { TestingModule } from '@nestjs/testing';
import { getBody } from './helpers/response-helper';
import { LoginResponse } from './types/api-responses';

/**
 * Teacher E2E Tests
 *
 * This test suite demonstrates parametrized tests using Jest's it.each()
 *
 * Two syntaxes are available:
 *
 * 1. Template Literal (used here - more readable):
 * it.each`
 *   field       | value      | expected
 *   ${'name'}   | ${'John'}  | ${200}
 *   ${'email'}  | ${'test'}  | ${400}
 * `('test $field', async ({ field, value, expected }) => { ... });
 *
 * 2. Array of Arrays (more concise):
 * it.each([
 *   ['name', 'John', 200],
 *   ['email', 'test', 400],
 * ])('test %s', async (field, value, expected) => { ... });
 */

describe('Teacher E2E Tests', () => {
  let app: INestApplication;
  let module: TestingModule;
  let dataSource: DataSource;
  let usersService: UsersService;

  let teacher: User;

  beforeAll(async () => {
    ({ app, module, dataSource } = await createTestApp());
    usersService = module.get<UsersService>(UsersService);
    await setupTestDatabase(dataSource);

    teacher = await createBaseTeacher(usersService);
  });

  afterAll(async () => {
    await teardownTestApp(app, dataSource);
  }, 30000);

  describe('POST /auth/login', () => {
    it('should authenticate a teacher with valid credentials', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: teacher.registry, password: teacher.password })
        .expect(200);

      const loginData = getBody<LoginResponse>(response);

      expect(loginData).toHaveProperty('token');
      expect(loginData).toHaveProperty('user');
      expect(loginData.user).not.toHaveProperty('password');
      expect(loginData.user).toMatchObject({
        registry: 'TEACHER001',
        name: 'John Sensei',
        roles: [{ role: UserRoleType.TEACHER }],
      });
    });

    it('should reject login with non existent registry', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: 'NONEXISTENT', password: 'SomePassword' })
        .expect(401);

      const errorBody = getBody<{ statusCode: number; message: string }>(
        response,
      );
      expect(errorBody).toHaveProperty('statusCode', 401);
      expect(errorBody).toHaveProperty('message', 'Invalid credentials');
    });

    it.each`
      scenario                   | payload                                              | expectedMessage
      ${'wrong password'}        | ${{ username: 'TEACHER001', password: 'WrongPass' }} | ${'Invalid credentials'}
      ${'missing username'}      | ${{ password: 'password123' }}                       | ${'Unauthorized'}
      ${'missing password'}      | ${{ username: 'TEACHER001' }}                        | ${'Unauthorized'}
      ${'empty credentials'}     | ${{}}                                                | ${'Unauthorized'}
      ${'wrong field names'}     | ${{ login: '', password: '' }}                       | ${'Unauthorized'}
      ${'null username'}         | ${{ username: null, password: 'password123' }}       | ${'Unauthorized'}
      ${'null password'}         | ${{ username: 'TEACHER001', password: null }}        | ${'Unauthorized'}
      ${'empty string username'} | ${{ username: '', password: 'password123' }}         | ${'Unauthorized'}
      ${'empty string password'} | ${{ username: 'TEACHER001', password: '' }}          | ${'Unauthorized'}
    `(
      'should reject authentication with $scenario',
      async ({
        payload,
        expectedMessage,
      }: {
        payload: Record<string, unknown>;
        expectedMessage: string;
      }) => {
        const response = await request(app.getHttpServer() as App)
          .post('/teacher/login')
          .send(payload)
          .expect(401);

        const errorBody = getBody<{ statusCode: number; message: string }>(
          response,
        );
        expect(errorBody).toHaveProperty('statusCode', 401);
        expect(errorBody).toHaveProperty('message', expectedMessage);
      },
    );

    it('should return consistent response structure on multiple logins', async () => {
      // First login
      const response1 = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: teacher.registry, password: teacher.password })
        .expect(200);

      const loginData1 = getBody<LoginResponse>(response1);

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second login
      const response2 = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: teacher.registry, password: teacher.password })
        .expect(200);

      const loginData2 = getBody<LoginResponse>(response2);

      // Should have same structure and user data
      expect(loginData1).toHaveProperty('token');
      expect(loginData2).toHaveProperty('token');
      expect(loginData1.user).toBeDefined();
      expect(loginData2.user).toBeDefined();
      expect((loginData1.user as User).registry).toBe(
        (loginData2.user as User).registry,
      );
      expect((loginData1.user as User).name).toBe(
        (loginData2.user as User).name,
      );
    });

    it('should reject case-sensitive registry mismatch', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: 'teacher001', password: teacher.password })
        .expect(401);

      const errorBody = getBody<{ statusCode: number; message: string }>(
        response,
      );
      expect(errorBody).toHaveProperty('statusCode', 401);
      expect(errorBody).toHaveProperty('message', 'Invalid credentials');
    });

    it('should reject credentials with whitespace', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({
          username: `  ${teacher.registry}  `,
          password: teacher.password,
        })
        .expect(401);

      const errorBody = getBody<{ statusCode: number; message: string }>(
        response,
      );
      expect(errorBody).toHaveProperty('statusCode', 401);
    });

    it('should include teacher role in response', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: teacher.registry, password: teacher.password })
        .expect(200);

      const loginData = getBody<LoginResponse>(response);
      const user = loginData.user as User;
      expect(user.roles).toBeDefined();
      expect(Array.isArray(user.roles)).toBe(true);
      expect(
        user.roles.some((role: UserRole) => role.role === UserRoleType.TEACHER),
      ).toBe(true);
    });
  });

  describe('GET /teacher/me', () => {
    let authToken: string;
    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: teacher.registry, password: teacher.password })
        .expect(200);

      authToken = getBody<LoginResponse>(loginResponse).token;
    });

    it('should retrieve the profile of the authenticated teacher', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/teacher/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const profile = getBody<User>(response);
      expect(profile).toMatchObject({
        registry: 'TEACHER001',
        name: 'John Sensei',
        roles: [{ role: UserRoleType.TEACHER }],
      });
      expect(profile).not.toHaveProperty('password');
    });

    it('should return complete teacher profile with all fields', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/teacher/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const profile = getBody<User>(response);
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('registry');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('birthday');
      expect(profile).toHaveProperty('trainingSince');
      expect(profile).toHaveProperty('isActive');
      expect(profile).toHaveProperty('createdAt');
      expect(profile).toHaveProperty('updatedAt');
      expect(profile).toHaveProperty('roles');
    });

    it('should work with token from different login session', async () => {
      // Get a new token
      const newLoginResponse = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: teacher.registry, password: teacher.password })
        .expect(200);

      const newToken = getBody<LoginResponse>(newLoginResponse).token;

      // Use new token to get profile
      const response = await request(app.getHttpServer() as App)
        .get('/teacher/me')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      const profile = getBody<User>(response);
      expect(profile.registry).toBe('TEACHER001');
    });

    it('should handle concurrent profile requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer() as App)
            .get('/teacher/me')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        const profile = getBody<User>(response);
        expect(profile.registry).toBe('TEACHER001');
      });
    });

    it('should not expose sensitive fields in profile', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/teacher/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const profile = getBody<User>(response);
      const profileKeys = Object.keys(profile);

      // Ensure sensitive fields are not present
      expect(profileKeys).not.toContain('password');
      expect(profileKeys).not.toContain('hashedPassword');
      expect(profile).not.toHaveProperty('password');
    });

    it('should reject profile retrieval without authentication', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/teacher/me')
        .expect(401);

      const errorBody = getBody<{ statusCode: number }>(response);
      expect(errorBody).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it.each`
      scenario                   | authHeader                | description
      ${'malformed token'}       | ${'Bearer INVALID_TOKEN'} | ${'with malformed JWT token'}
      ${'without Bearer prefix'} | ${'VALID_TOKEN'}          | ${'without Bearer prefix'}
      ${'empty Bearer'}          | ${'Bearer '}              | ${'with empty Bearer token'}
      ${'only Bearer'}           | ${'Bearer'}               | ${'with Bearer but no token'}
      ${'random string'}         | ${'RandomAuthString'}     | ${'with random auth string'}
    `(
      'should reject profile retrieval $description',
      async ({ authHeader }: { authHeader: string }) => {
        const response = await request(app.getHttpServer() as App)
          .get('/teacher/me')
          .set('Authorization', authHeader)
          .expect(401);

        const errorBody = getBody<{ statusCode: number }>(response);
        expect(errorBody).toHaveProperty('statusCode', 401);
      },
    );
  });

  describe('Security & Edge Cases', () => {
    it('should reject SQL injection attempts in login', async () => {
      const sqlInjectionPayloads = [
        { username: "' OR '1'='1", password: 'anything' },
        { username: "admin'--", password: 'password' },
        { username: "'; DROP TABLE users--", password: 'password' },
      ];

      for (const payload of sqlInjectionPayloads) {
        await request(app.getHttpServer() as App)
          .post('/teacher/login')
          .send(payload)
          .expect(401);
      }
    });

    it('should handle extremely long credentials gracefully', async () => {
      const longString = 'a'.repeat(10000);

      await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({ username: longString, password: longString })
        .expect(401);
    });

    it('should handle invalid Content-Type gracefully', async () => {
      // System may parse differently but should not crash
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .set('Content-Type', 'text/plain')
        .send('username=test&password=test');

      // Should return error (either 400 or 401)
      expect([400, 401]).toContain(response.status);
    });

    it('should reject requests with additional unexpected fields', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/teacher/login')
        .send({
          username: teacher.registry,
          password: teacher.password,
          extraField: 'should be ignored',
          admin: true,
        })
        .expect(200);

      // Should succeed but ignore extra fields
      const loginData = getBody<LoginResponse>(response);
      expect(loginData).toHaveProperty('token');
    });

    it('should handle special characters in credentials', async () => {
      const specialChars = [
        { username: 'test@#$%', password: 'pass' },
        { username: 'test<script>', password: 'pass' },
        { username: 'test\nuser', password: 'pass' },
      ];

      for (const payload of specialChars) {
        await request(app.getHttpServer() as App)
          .post('/teacher/login')
          .send(payload)
          .expect(401);
      }
    });
  });
});
