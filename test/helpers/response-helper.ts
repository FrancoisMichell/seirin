import { Response } from 'supertest';

/**
 * Type-safe helper to extract and type response body from supertest
 * @param response - The supertest response object
 * @returns Typed response body
 */
export function getBody<T>(response: Response): T {
  return response.body as T;
}

/**
 * Type-safe helper to extract array response body from supertest
 * @param response - The supertest response object
 * @returns Typed array response body
 */
export function getBodyArray<T>(response: Response): T[] {
  return response.body as T[];
}

/**
 * Extract response body as generic object
 */
export function getBodyAsObject(response: Response): Record<string, unknown> {
  return response.body as Record<string, unknown>;
}
