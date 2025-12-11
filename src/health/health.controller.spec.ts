import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  describe('getHealth', () => {
    it('should return status ok', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
