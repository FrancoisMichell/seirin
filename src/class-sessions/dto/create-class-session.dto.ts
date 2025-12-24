import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateClassSessionDto {
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in the format HH:mm',
  })
  @IsOptional()
  startTime?: string;

  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in the format HH:mm',
  })
  @IsOptional()
  endTime?: string;

  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsNotEmpty()
  teacherId: string;
}
