import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums';

export class CreateAttendanceDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
