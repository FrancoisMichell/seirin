import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClassDto extends PartialType(CreateClassDto) {
  @ApiProperty({
    description: 'Status of the class',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (typeof value === 'boolean') return value;
      return undefined;
    },
    { toClassOnly: true },
  )
  isActive?: boolean;
}
