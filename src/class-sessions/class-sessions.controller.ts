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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ClassSessionsService } from './class-sessions.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { FindAllClassSessionsDto } from './dto/find-all-class-sessions.dto';
import { FindByDateRangeDto } from './dto/find-by-date-range.dto';
import { IncludeInactiveDto } from 'src/common/dto/include-inactive.dto';
import { Roles } from 'src/common/decorators';
import { UserRoleType } from 'src/common/enums';

@ApiTags('class-sessions')
@ApiBearerAuth('JWT-auth')
@Controller('class-sessions')
@Roles(UserRoleType.TEACHER)
export class ClassSessionsController {
  constructor(private readonly classSessionsService: ClassSessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class session' })
  @ApiResponse({
    status: 201,
    description: 'Class session successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createClassSessionDto: CreateClassSessionDto) {
    return this.classSessionsService.create(createClassSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all class sessions with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of class sessions',
  })
  findAll(@Query() filters: FindAllClassSessionsDto) {
    return this.classSessionsService.findAll(filters);
  }

  @Get('by-class/:classId')
  @ApiOperation({ summary: 'Get sessions by class ID' })
  @ApiParam({ name: 'classId', description: 'Class UUID' })
  @ApiResponse({ status: 200, description: 'List of sessions for the class' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: IncludeInactiveDto,
  ) {
    return this.classSessionsService.findByClass(
      classId,
      query.includeInactive as unknown as boolean,
    );
  }

  @Get('by-teacher/:teacherId')
  @ApiOperation({ summary: 'Get sessions by teacher ID' })
  @ApiParam({ name: 'teacherId', description: 'Teacher UUID' })
  @ApiResponse({ status: 200, description: 'List of sessions for the teacher' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findByTeacher(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Query() query: IncludeInactiveDto,
  ) {
    return this.classSessionsService.findByTeacher(
      teacherId,
      query.includeInactive as unknown as boolean,
    );
  }

  @Get('by-date-range')
  @ApiOperation({ summary: 'Get sessions within a date range' })
  @ApiResponse({ status: 200, description: 'List of sessions in range' })
  findByDateRange(@Query() query: FindByDateRangeDto) {
    return this.classSessionsService.findByDateRange(
      query.startDate,
      query.endDate,
      query.includeInactive as unknown as boolean,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a class session by ID' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({ status: 200, description: 'Class session found' })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a class session' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({
    status: 200,
    description: 'Class session successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassSessionDto: UpdateClassSessionDto,
  ) {
    return this.classSessionsService.update(id, updateClassSessionDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a class session' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({ status: 200, description: 'Class session activated' })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a class session' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({ status: 200, description: 'Class session deactivated' })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a class session' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({ status: 204, description: 'Class session deleted' })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.remove(id);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Mark session as started' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({ status: 200, description: 'Session started' })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.start(id);
  }

  @Patch(':id/end')
  @ApiOperation({ summary: 'Mark session as ended' })
  @ApiParam({ name: 'id', description: 'Class session UUID' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  @ApiResponse({ status: 404, description: 'Class session not found' })
  end(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.end(id);
  }
}
