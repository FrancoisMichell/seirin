import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DayOfWeek } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    description: 'UUID of the teacher responsible for the class',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({
    description: 'Name of the class/turma',
    example: 'Jiu-Jitsu Iniciante',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Days of the week when the class occurs',
    example: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    enum: DayOfWeek,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsEnum(DayOfWeek, { each: true })
  days: DayOfWeek[];

  @ApiProperty({
    description: 'Start time of the class in HH:MM format (24h)',
    example: '18:30',
    pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$',
  })
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Duration of the class in minutes',
    example: 90,
    minimum: 30,
    maximum: 300,
  })
  @IsInt()
  @Min(30)
  @Max(300)
  durationMinutes: number;
}
