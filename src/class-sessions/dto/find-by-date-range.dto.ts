import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FindByDateRangeDto {
  @IsDateString()
  @Type(() => Date)
  startDate: Date;

  @IsDateString()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}
