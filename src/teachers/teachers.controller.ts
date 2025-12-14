import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from 'src/common/auth/auth.service';
import { LocalAuthGuard } from 'src/common/auth/guards/local-auth.guard';
import { Public } from 'src/common/decorators';
import { TeachersService } from 'src/teachers/teachers.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { id: number; registry: string };
}

@Controller('teacher')
export class TeachersController {
  constructor(
    private authService: AuthService,
    private teacherService: TeachersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @Get('me')
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.teacherService.findByRegistry(req.user.registry);
  }
}
