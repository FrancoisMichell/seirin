import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { PasswordUtil } from 'src/common/utils/password.util';

function getServer(app: INestApplication) {
  return app.getHttpServer() as unknown as Parameters<typeof request>[0];
}

describe('Validation (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Create test teacher user
    const dataSource = app.get(DataSource);
    const hashedPassword = await PasswordUtil.hashPassword('teste123');
    await dataSource.query(
      `INSERT INTO users (id, name, registry, password, belt, is_active) 
     VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Test Teacher', '123321', $1, 'Black', true)
     ON CONFLICT (registry) DO NOTHING`,
      [hashedPassword],
    );
    await dataSource.query(`
    INSERT INTO user_roles (id, role, "userId")
    VALUES ('22222222-2222-2222-2222-222222222222', 'teacher', '550e8400-e29b-41d4-a716-446655440001')
    ON CONFLICT DO NOTHING`);

    const login = await request(getServer(app))
      .post('/teacher/login')
      .send({ username: '123321', password: 'teste123' })
      .expect(201);

    authToken = (login.body as Record<string, unknown>).access_token as string;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /students', () => {
    it('should return 400 for empty name', async () => {
      const res = await request(getServer(app))
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '', belt: 'White' })
        .expect(400);
      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('message');
    });

    it('should return 400 for invalid belt enum', async () => {
      const res = await request(getServer(app))
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', belt: 'Purple' })
        .expect(400);
      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('message');
    });

    it('should return 400 for invalid birthday format', async () => {
      const res = await request(getServer(app))
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', belt: 'White', birthday: '2000-13-45' })
        .expect(400);
      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('message');
    });

    it('should return 400 for invalid trainingSince format', async () => {
      const res = await request(getServer(app))
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', belt: 'White', trainingSince: 'abcd' })
        .expect(400);
      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('message');
    });

    it('should strip unknown fields and forbid non-whitelisted', async () => {
      const res = await request(getServer(app))
        .post('/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test', belt: 'White', unknownField: 'x' })
        .expect(400);
      const body = res.body as Record<string, unknown>;
      expect(body).toHaveProperty('message');
    });
  });

  describe('GET /students/:id', () => {
    it('should return 404 for non-existing UUID', async () => {
      await request(getServer(app))
        .get('/students/550e8400-e29b-41d4-a716-4466554400ff')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
