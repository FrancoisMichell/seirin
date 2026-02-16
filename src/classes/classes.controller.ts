import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FindAllClassesDto } from './dto/find-all-classes.dto';
import { Roles, CurrentUser } from 'src/common/decorators';
import { UserRoleType } from 'src/common/enums';

@ApiTags('classes')
@ApiBearerAuth('JWT-auth')
@Controller('classes')
@Roles(UserRoleType.TEACHER)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class/turma' })
  @ApiResponse({
    status: 201,
    description: 'Class successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createClassDto: CreateClassDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.classesService.create(createClassDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all classes with pagination and optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of classes',
  })
  findAll(
    @Query() query: FindAllClassesDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.classesService.findAll(
      query.page ?? 1,
      query.limit ?? 10,
      query.includeInactive as unknown as boolean,
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a class by ID' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: 200, description: 'Class found' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: 200, description: 'Class successfully updated' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.update(id, updateClassDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: 200, description: 'Class deactivated' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiResponse({ status: 200, description: 'Class activated' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.activate(id);
  }

  @Post(':id/enroll/:studentId')
  @ApiOperation({ summary: 'Enroll a student in a class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 404, description: 'Class or student not found' })
  @ApiResponse({ status: 409, description: 'Student already enrolled' })
  enrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.classesService.enrollStudent(id, studentId);
  }

  @Delete(':id/enroll/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unenroll a student from a class' })
  @ApiParam({ name: 'id', description: 'Class UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  @ApiResponse({ status: 204, description: 'Student unenrolled successfully' })
  @ApiResponse({ status: 404, description: 'Class or student not found' })
  unenrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.classesService.unenrollStudent(id, studentId);
  }
}
