import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { Public } from 'src/common/decorators';
import { TeachersService } from 'src/teachers/teachers.service';
import { AuthenticatedRequestDto } from './dto/authenticated-request.dto';

@Controller('teacher')
export class TeachersController {
  constructor(
    private authService: AuthService,
    private teacherService: TeachersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: AuthenticatedRequestDto) {
    return this.authService.login(req.user);
  }

  @Get('me')
  getProfile(@Request() req: AuthenticatedRequestDto) {
    return this.teacherService.findByRegistry(req.user.registry);
  }
}
