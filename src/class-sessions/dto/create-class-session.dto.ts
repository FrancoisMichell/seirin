import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassSessionDto {
  @ApiProperty({
    description: 'Date of the class session',
    example: '2024-01-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiPropertyOptional({
    description: 'Start time in HH:MM format. Defaults to class schedule time',
    example: '18:30',
    pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in the format HH:mm',
  })
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    description:
      'End time in HH:MM format. Calculated from start + duration if not provided',
    example: '20:00',
    pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$',
  })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in the format HH:mm',
  })
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the session',
    example: 'Trabalhar no triângulo hoje',
    maxLength: 500,
  })
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'UUID of the class/turma this session belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    description: 'UUID of the teacher conducting the session',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;
}
