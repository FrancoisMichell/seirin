import { IsOptional, IsUUID, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindAllClassSessionsDto {
  @ApiPropertyOptional({
    description: 'Filter by class/turma UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filter by teacher UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Filter sessions starting from this date',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter sessions up to this date',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  @IsBoolean()
  isActive?: string;
}
