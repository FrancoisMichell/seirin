import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IncludeInactiveDto {
  @ApiPropertyOptional({
    description: 'Include inactive records in the response',
    example: false,
    default: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return false;
  })
  @IsBoolean()
  includeInactive?: string;
}
