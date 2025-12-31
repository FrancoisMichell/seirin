import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { Public, Roles } from 'src/common/decorators';
import { TeachersService } from 'src/teachers/teachers.service';
import { AuthenticatedRequestDto } from './dto/authenticated-request.dto';
import { UserRoleType } from 'src/common/enums';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@ApiTags('teachers')
@Controller('teacher')
@Roles(UserRoleType.TEACHER)
export class TeachersController {
  constructor(
    private authService: AuthService,
    private teacherService: TeachersService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Teacher login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        registry: { type: 'string', example: 'PROF001' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  login(@Request() req: AuthenticatedRequestDto) {
    return this.authService.login(req.user);
  }

  @Get('me')
  @SkipThrottle()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current teacher profile' })
  @ApiResponse({ status: 200, description: 'Teacher profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: AuthenticatedRequestDto) {
    return this.teacherService.findByRegistry(req.user.registry!);
  }
}
