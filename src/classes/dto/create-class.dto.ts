import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

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
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];

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
