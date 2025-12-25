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
import { ClassSessionsService } from './class-sessions.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { FindAllClassSessionsDto } from './dto/find-all-class-sessions.dto';
import { FindByDateRangeDto } from './dto/find-by-date-range.dto';
import { IncludeInactiveDto } from 'src/common/dto/include-inactive.dto';
import { Roles } from 'src/common/decorators';
import { UserRoleType } from 'src/common/enums';

@Controller('class-sessions')
@Roles(UserRoleType.TEACHER)
export class ClassSessionsController {
  constructor(private readonly classSessionsService: ClassSessionsService) {}

  @Post()
  create(@Body() createClassSessionDto: CreateClassSessionDto) {
    return this.classSessionsService.create(createClassSessionDto);
  }

  @Get()
  findAll(@Query() filters: FindAllClassSessionsDto) {
    return this.classSessionsService.findAll(filters);
  }

  @Get('by-class/:classId')
  findByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: IncludeInactiveDto,
  ) {
    return this.classSessionsService.findByClass(
      classId,
      query.includeInactive,
    );
  }

  @Get('by-teacher/:teacherId')
  findByTeacher(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Query() query: IncludeInactiveDto,
  ) {
    return this.classSessionsService.findByTeacher(
      teacherId,
      query.includeInactive,
    );
  }

  @Get('by-date-range')
  findByDateRange(@Query() query: FindByDateRangeDto) {
    return this.classSessionsService.findByDateRange(
      query.startDate,
      query.endDate,
      query.includeInactive,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassSessionDto: UpdateClassSessionDto,
  ) {
    return this.classSessionsService.update(id, updateClassSessionDto);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.remove(id);
  }

  @Patch(':id/start')
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.start(id);
  }

  @Patch(':id/end')
  end(@Param('id', ParseUUIDPipe) id: string) {
    return this.classSessionsService.end(id);
  }
}
