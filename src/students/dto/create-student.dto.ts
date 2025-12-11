import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Belt } from '../../common/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ description: 'Name of the student', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Belt level of the student',
    example: Belt.White,
  })
  @IsEnum(Belt)
  belt: Belt;

  @ApiProperty({
    description: 'Birthday of the student',
    example: '2000-01-01',
  })
  @IsDateString()
  birthday?: Date;

  @ApiProperty({
    description: 'Date since the student has been training',
    example: '2015-06-01',
  })
  @IsDateString()
  trainingSince?: Date;
}
