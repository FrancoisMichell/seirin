import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class IncludeInactiveDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}
