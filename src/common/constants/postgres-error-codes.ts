/**
 * PostgreSQL Error Codes
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PostgresErrorCode = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
} as const;

export type PostgresErrorCodeType =
  (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];
