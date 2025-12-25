import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
