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

export class CreateClassDto {
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsEnum(DayOfWeek, { each: true })
  days: DayOfWeek[];

  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  @IsNotEmpty()
  startTime: string;

  @IsInt()
  @Min(30)
  @Max(300)
  durationMinutes: number;
}
