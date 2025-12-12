import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Validation (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /students', () => {
    it('should return 400 for empty name', async () => {
      const res = await request(app.getHttpServer())
        .post('/students')
        .send({ name: '', belt: 'White' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for invalid belt enum', async () => {
      const res = await request(app.getHttpServer())
        .post('/students')
        .send({ name: 'Test', belt: 'Purple' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for invalid birthday format', async () => {
      const res = await request(app.getHttpServer())
        .post('/students')
        .send({ name: 'Test', belt: 'White', birthday: '2000-13-45' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('should return 400 for invalid trainingSince format', async () => {
      const res = await request(app.getHttpServer())
        .post('/students')
        .send({ name: 'Test', belt: 'White', trainingSince: 'abcd' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('should strip unknown fields and forbid non-whitelisted', async () => {
      const res = await request(app.getHttpServer())
        .post('/students')
        .send({ name: 'Test', belt: 'White', unknownField: 'x' })
        .expect(400);
      expect(res.body.message).toContain(
        'property unknownField should not exist',
      );
    });
  });

  describe('GET /students/:id', () => {
    it('should return 404 for non-existing UUID', async () => {
      await request(app.getHttpServer())
        .get('/students/550e8400-e29b-41d4-a716-4466554400ff')
        .expect(404);
    });
  });
});
