import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindByDateRangeDto {
  @ApiProperty({
    description: 'Start date of the range',
    example: '2024-01-01',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: 'End date of the range',
    example: '2024-12-31',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Include inactive sessions in results',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}
