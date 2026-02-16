import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DayOfWeek } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
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
  @Transform(
    ({ value }) => {
      if (Array.isArray(value)) {
        return value.map((day: string) => {
          const parsed = parseInt(day, 10);
          return (isNaN(parsed) ? day : parsed) as DayOfWeek;
        });
      }
      return value as DayOfWeek;
    },
    { toClassOnly: true },
  )
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
