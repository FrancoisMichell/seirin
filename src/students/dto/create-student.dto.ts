import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Belt } from '../../common/enums';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Belt)
  belt: Belt;

  @IsDateString()
  birthday?: Date;

  @IsDateString()
  trainingSince?: Date;
}
