import { EntityUtil } from './entity.util';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

/* eslint-disable @typescript-eslint/unbound-method */
describe('EntityUtil', () => {
  interface MockEntity {
    id: string;
    name: string;
    isActive: boolean;
  }

  let mockRepository: jest.Mocked<Repository<MockEntity>>;

  beforeEach(() => {
    const saveMock = jest.fn();
    mockRepository = {
      save: saveMock,
    } as unknown as jest.Mocked<Repository<MockEntity>>;
  });

  describe('toggleActive', () => {
    it('should activate an entity', async () => {
      const entity: MockEntity = {
        id: '123',
        name: 'Test',
        isActive: false,
      };

      mockRepository.save.mockResolvedValue({ ...entity, isActive: true });

      const result = await EntityUtil.toggleActive(
        entity,
        mockRepository,
        true,
      );

      expect(entity.isActive).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(result.isActive).toBe(true);
    });

    it('should deactivate an entity', async () => {
      const entity: MockEntity = {
        id: '123',
        name: 'Test',
        isActive: true,
      };

      mockRepository.save.mockResolvedValue({ ...entity, isActive: false });

      const result = await EntityUtil.toggleActive(
        entity,
        mockRepository,
        false,
      );

      expect(entity.isActive).toBe(false);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(result.isActive).toBe(false);
    });
  });

  describe('updateFields', () => {
    it('should update fields that are defined', () => {
      const target = {
        id: '123',
        name: 'Original',
        email: 'original@test.com',
        age: 25,
      };

      const source = {
        name: 'Updated',
        email: 'updated@test.com',
      };

      EntityUtil.updateFields(target, source);

      expect(target.name).toBe('Updated');
      expect(target.email).toBe('updated@test.com');
      expect(target.age).toBe(25);
      expect(target.id).toBe('123');
    });

    it('should not update fields that are undefined', () => {
      const target = {
        id: '123',
        name: 'Original',
        email: 'original@test.com',
      };

      const source = {
        name: 'Updated',
        email: undefined,
      };

      EntityUtil.updateFields(target, source);

      expect(target.name).toBe('Updated');
      expect(target.email).toBe('original@test.com');
    });

    it('should exclude specified fields from update', () => {
      const target = {
        id: '123',
        name: 'Original',
        email: 'original@test.com',
        role: 'user',
      };

      const source = {
        name: 'Updated',
        email: 'updated@test.com',
        role: 'admin',
      };

      EntityUtil.updateFields(target, source, ['role', 'id']);

      expect(target.name).toBe('Updated');
      expect(target.email).toBe('updated@test.com');
      expect(target.role).toBe('user');
      expect(target.id).toBe('123');
    });

    it('should handle empty source object', () => {
      const target = {
        id: '123',
        name: 'Original',
      };

      const source = {};

      EntityUtil.updateFields(target, source);

      expect(target.name).toBe('Original');
      expect(target.id).toBe('123');
    });

    it('should update fields with falsy values except undefined', () => {
      const target = {
        id: '123',
        name: 'Original',
        count: 10,
        enabled: true,
        description: 'text',
      };

      const source = {
        name: '',
        count: 0,
        enabled: false,
        description: null,
      } as unknown as Partial<typeof target>;

      EntityUtil.updateFields(target, source);

      expect(target.name).toBe('');
      expect(target.count).toBe(0);
      expect(target.enabled).toBe(false);
      expect(target.description).toBe(null);
    });
  });

  describe('ensureNotInArray', () => {
    it('should not throw when item does not exist in array', () => {
      const array = [
        { id: '1', name: 'Item 1', isActive: true },
        { id: '2', name: 'Item 2', isActive: true },
      ];

      expect(() => {
        EntityUtil.ensureNotInArray(array, '3', 'Item already exists');
      }).not.toThrow();
    });

    it('should throw BadRequestException when item exists in array', () => {
      const array = [
        { id: '1', name: 'Item 1', isActive: true },
        { id: '2', name: 'Item 2', isActive: true },
      ];

      expect(() => {
        EntityUtil.ensureNotInArray(array, '2', 'Item already exists');
      }).toThrow(BadRequestException);

      expect(() => {
        EntityUtil.ensureNotInArray(array, '2', 'Item already exists');
      }).toThrow('Item already exists');
    });

    it('should handle empty array', () => {
      const array: MockEntity[] = [];

      expect(() => {
        EntityUtil.ensureNotInArray(array, '1', 'Item already exists');
      }).not.toThrow();
    });
  });

  describe('removeFromArray', () => {
    it('should remove item from array when it exists', () => {
      const array = [
        { id: '1', name: 'Item 1', isActive: true },
        { id: '2', name: 'Item 2', isActive: true },
        { id: '3', name: 'Item 3', isActive: true },
      ];

      EntityUtil.removeFromArray(array, '2', 'Item not found');

      expect(array).toHaveLength(2);
      expect(array.find((item) => item.id === '2')).toBeUndefined();
      expect(array[0].id).toBe('1');
      expect(array[1].id).toBe('3');
    });

    it('should throw NotFoundException when item does not exist', () => {
      const array = [
        { id: '1', name: 'Item 1', isActive: true },
        { id: '2', name: 'Item 2', isActive: true },
      ];

      expect(() => {
        EntityUtil.removeFromArray(array, '3', 'Item not found');
      }).toThrow(NotFoundException);

      expect(() => {
        EntityUtil.removeFromArray(array, '3', 'Item not found');
      }).toThrow('Item not found');
    });

    it('should throw NotFoundException on empty array', () => {
      const array: MockEntity[] = [];

      expect(() => {
        EntityUtil.removeFromArray(array, '1', 'Item not found');
      }).toThrow(NotFoundException);
    });

    it('should remove first item from array', () => {
      const array = [
        { id: '1', name: 'Item 1', isActive: true },
        { id: '2', name: 'Item 2', isActive: true },
      ];

      EntityUtil.removeFromArray(array, '1', 'Item not found');

      expect(array).toHaveLength(1);
      expect(array[0].id).toBe('2');
    });

    it('should remove last item from array', () => {
      const array = [
        { id: '1', name: 'Item 1', isActive: true },
        { id: '2', name: 'Item 2', isActive: true },
      ];

      EntityUtil.removeFromArray(array, '2', 'Item not found');

      expect(array).toHaveLength(1);
      expect(array[0].id).toBe('1');
    });
  });

  describe('ensureActive', () => {
    it('should not throw when entity is active', () => {
      const entity: MockEntity = {
        id: '123',
        name: 'Test',
        isActive: true,
      };

      expect(() => {
        EntityUtil.ensureActive(entity, 'Entity is not active');
      }).not.toThrow();
    });

    it('should throw BadRequestException when entity is inactive', () => {
      const entity: MockEntity = {
        id: '123',
        name: 'Test',
        isActive: false,
      };

      expect(() => {
        EntityUtil.ensureActive(entity, 'Entity is not active');
      }).toThrow(BadRequestException);

      expect(() => {
        EntityUtil.ensureActive(entity, 'Entity is not active');
      }).toThrow('Entity is not active');
    });

    it('should throw with custom error message', () => {
      const entity: MockEntity = {
        id: '123',
        name: 'Test',
        isActive: false,
      };

      expect(() => {
        EntityUtil.ensureActive(entity, 'Custom error message');
      }).toThrow('Custom error message');
    });
  });
});
