import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceStatus } from 'src/common/enums';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Post('bulk/:sessionId')
  bulkCreate(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.attendancesService.bulkCreate(sessionId);
  }

  @Get()
  findAll(
    @Query('sessionId') sessionId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: AttendanceStatus,
    @Query('isEnrolledClass') isEnrolledClass?: string,
  ) {
    return this.attendancesService.findAll({
      sessionId,
      studentId,
      status,
      isEnrolledClass:
        isEnrolledClass !== undefined ? isEnrolledClass === 'true' : undefined,
    });
  }

  @Get('session/:sessionId')
  findBySession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.attendancesService.findBySession(sessionId);
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.attendancesService.findByStudent(studentId, page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Patch(':id/mark-present')
  markPresent(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markPresent(id);
  }

  @Patch(':id/mark-late')
  markLate(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markLate(id);
  }

  @Patch(':id/mark-absent')
  markAbsent(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markAbsent(id);
  }

  @Patch(':id/mark-excused')
  markExcused(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markExcused(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.remove(id);
  }
}
