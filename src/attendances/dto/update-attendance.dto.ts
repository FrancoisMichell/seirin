import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Update attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.LATE,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Update notes about the attendance',
    example: 'Justificativa: trabalho',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
