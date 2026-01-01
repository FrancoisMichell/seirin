import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Belt } from '../../common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryUsersDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by user name (partial match, case-insensitive)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by registry number',
    example: '2021001',
  })
  @IsOptional()
  @IsString()
  registry?: string;

  @ApiPropertyOptional({
    description: 'Filter by belt levels (can specify multiple)',
    enum: Belt,
    isArray: true,
    example: [Belt.WHITE, Belt.YELLOW],
  })
  @IsOptional()
  @Transform(
    ({ value }) => {
      if (Array.isArray(value)) return value as Array<Belt>;
      if (typeof value === 'string') return [value as Belt];
      return value as Array<Belt>;
    },
    { toClassOnly: true },
  )
  @IsEnum(Belt, { each: true })
  belt?: Belt[];

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (typeof value === 'boolean') return value;
      return undefined;
    },
    { toClassOnly: true },
  )
  isActive?: string;
  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['name', 'registry', 'belt', 'createdAt'],
    example: 'name',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'registry' | 'belt' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
    default: 'DESC',
  })
  @IsOptional()
  @Transform(
    ({ value }): string | undefined =>
      typeof value === 'string' ? value.toUpperCase() : undefined,
    { toClassOnly: true },
  )
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
