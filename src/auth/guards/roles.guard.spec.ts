import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleType } from 'src/common/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user is not authenticated', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRoleType.TEACHER]);

    const context = createMockExecutionContext({});

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when user has no roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRoleType.TEACHER]);

    const context = createMockExecutionContext({
      user: { userId: '123', roles: [] },
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRoleType.TEACHER]);

    const context = createMockExecutionContext({
      user: { userId: '123', roles: [UserRoleType.TEACHER] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRoleType.TEACHER, UserRoleType.STUDENT]);

    const context = createMockExecutionContext({
      user: { userId: '123', roles: [UserRoleType.STUDENT] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRoleType.TEACHER]);

    const context = createMockExecutionContext({
      user: { userId: '123', roles: [UserRoleType.STUDENT] },
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  function createMockExecutionContext(
    request: Record<string, unknown>,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }
});
