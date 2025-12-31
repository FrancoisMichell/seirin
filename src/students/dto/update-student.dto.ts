import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';
import { Belt } from 'src/common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiProperty({
    description: 'Password of the student',
    example: 'securePassword123',
    required: false,
  })
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Belt level of the student',
    example: Belt.WHITE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Belt)
  belt?: Belt;

  @ApiProperty({
    description: 'Active status of the student',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
