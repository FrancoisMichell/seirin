import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

export class EntityUtil {
  /**
   * Ativa ou desativa uma entidade com campo isActive
   */
  static async toggleActive<T extends { isActive: boolean }>(
    entity: T,
    repository: Repository<T>,
    active: boolean,
  ): Promise<T> {
    entity.isActive = active;
    return repository.save(entity);
  }

  /**
   * Atualiza campos de forma condicional (apenas se não undefined)
   */
  static updateFields<T extends object>(
    target: T,
    source: Partial<T>,
    excludeFields: string[] = [],
  ): void {
    Object.keys(source).forEach((key) => {
      if (excludeFields.includes(key)) {
        return;
      }
      const value = source[key as keyof T];
      if (value !== undefined) {
        target[key as keyof T] = value;
      }
    });
  }

  /**
   * Verifica se item já existe em array
   * @throws BadRequestException se já existir
   */
  static ensureNotInArray<T extends { id: string }>(
    array: T[],
    itemId: string,
    errorMessage: string,
  ): void {
    const exists = array.some((item) => item.id === itemId);
    if (exists) {
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Remove item de array por ID
   * @throws NotFoundException se não encontrar
   */
  static removeFromArray<T extends { id: string }>(
    array: T[],
    itemId: string,
    errorMessage: string,
  ): void {
    const index = array.findIndex((item) => item.id === itemId);
    if (index === -1) {
      throw new NotFoundException(errorMessage);
    }
    array.splice(index, 1);
  }

  /**
   * Valida se entidade está ativa
   * @throws BadRequestException se inativa
   */
  static ensureActive<T extends { isActive: boolean }>(
    entity: T,
    errorMessage: string,
  ): void {
    if (!entity.isActive) {
      throw new BadRequestException(errorMessage);
    }
  }
}
