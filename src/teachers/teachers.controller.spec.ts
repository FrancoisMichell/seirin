/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { AuthService } from '../auth/auth.service';

describe('TeachersController', () => {
  let controller: TeachersController;
  let service: TeachersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [
        {
          provide: TeachersService,
          useValue: {
            findByRegistry: jest.fn().mockReturnValue({
              id: 1,
              registry: 'test',
            }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ access_token: 'token' }),
          },
        },
      ],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
    service = module.get<TeachersService>(TeachersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return profile on getProfile', () => {
    const req = {
      user: { id: 1, registry: '123321' },
    };
    const result = controller.getProfile(req as any);
    expect(result).toBeDefined();
    expect(service.findByRegistry).toHaveBeenCalledWith('123321');
  });
});
