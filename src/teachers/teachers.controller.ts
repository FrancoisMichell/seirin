import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { Public, Roles } from 'src/common/decorators';
import { TeachersService } from 'src/teachers/teachers.service';
import { AuthenticatedRequestDto } from './dto/authenticated-request.dto';
import { UserRoleType } from 'src/common/enums';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

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
  login(@Request() req: AuthenticatedRequestDto) {
    return this.authService.login(req.user);
  }

  @Get('me')
  @SkipThrottle()
  getProfile(@Request() req: AuthenticatedRequestDto) {
    return this.teacherService.findByRegistry(req.user.registry!);
  }
}
