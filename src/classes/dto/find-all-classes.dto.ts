import { PickType, IntersectionType } from '@nestjs/swagger';
import { QueryUsersDto } from 'src/users/dto/query-users.dto';
import { IncludeInactiveDto } from 'src/common/dto/include-inactive.dto';

// Use only page and limit from QueryUsersDto
export class FindAllClassesDto extends IntersectionType(
  PickType(QueryUsersDto, ['page', 'limit'] as const),
  IncludeInactiveDto,
) {}
