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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}
