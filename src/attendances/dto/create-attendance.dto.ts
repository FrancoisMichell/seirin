import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'UUID of the class session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'UUID of the student',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({
    description: 'Attendance status',
    enum: AttendanceStatus,
    default: AttendanceStatus.PENDING,
    example: AttendanceStatus.PRESENT,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Additional notes about the attendance',
    example: 'Chegou 10 minutos atrasado',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
