import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

// Load appropriate .env file based on NODE_ENV
const isTest = process.env.NODE_ENV === 'test';
if (isTest) {
  config({ path: path.resolve(__dirname, '../.env.test'), override: true });
} else {
  config();
}

const configService = new ConfigService();

export const datasourceOptions: DataSourceOptions = {
  // @ts-expect-error // TypeORM expects predefined strings for type
  type: configService.getOrThrow<string>('DB_TYPE'),
  host: configService.getOrThrow<string>('DB_HOST'),
  port: parseInt(configService.getOrThrow<string>('DB_PORT'), 10),
  username: configService.getOrThrow<string>('DB_USER'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_NAME'),
  entities: isTest ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'],
  migrations: isTest ? ['db/migrations/*.ts'] : ['dist/db/migrations/*.js'],
  migrationsTableName: 'migrations',
  migrationsRun: false,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  extra: {
    max: 10,
  },
};

const dataSource = new DataSource(datasourceOptions);

export default dataSource;
