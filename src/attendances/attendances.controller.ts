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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceStatus } from 'src/common/enums';
import { Roles } from 'src/common/decorators';
import { UserRoleType } from 'src/common/enums';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@ApiTags('attendances')
@ApiBearerAuth('JWT-auth')
@Controller('attendances')
@Roles(UserRoleType.TEACHER)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new attendance record' })
  @ApiResponse({
    status: 201,
    description: 'Attendance record successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Post('bulk/:sessionId')
  @ApiOperation({
    summary: 'Bulk create attendance records for all enrolled students',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Class session UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Attendance records created for all enrolled students',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  bulkCreate(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.attendancesService.bulkCreate(sessionId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attendance records with filters' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Filter by session UUID',
  })
  @ApiQuery({
    name: 'studentId',
    required: false,
    description: 'Filter by student UUID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AttendanceStatus,
    description: 'Filter by attendance status',
  })
  @ApiQuery({
    name: 'isEnrolledClass',
    required: false,
    type: 'boolean',
    description: 'Filter by enrolled class status',
  })
  @ApiResponse({ status: 200, description: 'List of attendance records' })
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
  @ApiOperation({ summary: 'Get all attendance records for a session' })
  @ApiParam({ name: 'sessionId', description: 'Class session UUID' })
  @ApiResponse({ status: 200, description: 'List of attendance records' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findBySession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.attendancesService.findBySession(sessionId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get paginated attendance records for a student' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Paginated attendance records' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findByStudent(
      studentId,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an attendance record by ID' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance record found' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Patch(':id/mark-present')
  @ApiOperation({ summary: 'Mark attendance as PRESENT' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance marked as present' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  markPresent(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markPresent(id);
  }

  @Patch(':id/mark-late')
  @ApiOperation({ summary: 'Mark attendance as LATE' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance marked as late' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  markLate(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markLate(id);
  }

  @Patch(':id/mark-absent')
  @ApiOperation({ summary: 'Mark attendance as ABSENT' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance marked as absent' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  markAbsent(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markAbsent(id);
  }

  @Patch(':id/mark-excused')
  @ApiOperation({ summary: 'Mark attendance as EXCUSED' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance marked as excused' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  markExcused(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.markExcused(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance UUID' })
  @ApiResponse({ status: 200, description: 'Attendance record deleted' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.remove(id);
  }
}
