import * as Joi from 'joi';

// Validation schema for environment variables
export const envValidationSchema = Joi.object({
  DB_TYPE: Joi.string().valid('postgres').required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  RUN_MIGRATIONS: Joi.boolean().truthy('true').falsy('false').default(true),

  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
});

// Application configuration factory
export default () => ({
  database: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    runMigrations:
      (process.env.RUN_MIGRATIONS ?? 'true').toLowerCase() === 'true',
  },
  features: {
    swaggerEnabled:
      (process.env.SWAGGER_ENABLED ?? 'true').toLowerCase() === 'true',
  },
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
});
