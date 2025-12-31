import * as dotenv from 'dotenv';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/common/setup-app';
import { User } from 'src/users/entities/user.entity';
import { UserRoleType } from 'src/common/enums';
import { UsersService } from 'src/users/users.service';

dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
  override: true,
});

export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
}

/**
 * Creates and initializes a NestJS application for E2E testing.
 * Automatically applies common application setup and database configuration.
 */
export async function createTestApp(): Promise<TestAppContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  setupApp(app);
  await app.init();

  const dataSource = moduleFixture.get<DataSource>(DataSource);

  return {
    app,
    module: moduleFixture,
    dataSource,
  };
}

/**
 * Initializes the test database by dropping existing data and running migrations.
 * Waits for database connection before proceeding.
 *
 * @param dataSource - The TypeORM DataSource instance
 * @param waitTime - Time to wait for database connection (default: 2000ms)
 */
export async function setupTestDatabase(
  dataSource: DataSource,
  waitTime = 2000,
): Promise<void> {
  // Safety check: ensure we're using the test database
  const dbName = dataSource.options.database as string;
  if (!dbName.includes('test')) {
    throw new Error(
      `SAFETY CHECK FAILED: Attempting to drop non-test database: ${dbName}. ` +
        `Expected database name to contain 'test'. ` +
        `Current DB_NAME: ${process.env.DB_NAME}`,
    );
  }

  await new Promise((resolve) => setTimeout(resolve, waitTime));
  await dataSource.dropDatabase();
  await dataSource.runMigrations();
}

/**
 * Cleans up the test application and database connections.
 * Should be called in the afterAll hook of E2E tests.
 *
 * @param app - The NestJS application instance
 * @param dataSource - The TypeORM DataSource instance
 */
export async function teardownTestApp(
  app: INestApplication,
  dataSource?: DataSource,
): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    // Safety check: ensure we're using the test database
    const dbName = dataSource.options.database as string;
    if (!dbName.includes('test')) {
      throw new Error(
        `SAFETY CHECK FAILED: Attempting to drop non-test database: ${dbName}`,
      );
    }

    await dataSource.dropDatabase();
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
}

export async function createBaseTeacher(
  usersService: UsersService,
): Promise<User> {
  const teacherPassword = 'Teacher@123';
  const teacher = await usersService.create(
    {
      registry: 'TEACHER001',
      password: teacherPassword,
      name: 'John Sensei',
      birthday: new Date('1985-03-15'),
      trainingSince: new Date('2010-01-01'),
    },
    [UserRoleType.TEACHER],
  );
  teacher!.password = teacherPassword;

  return teacher!;
}
