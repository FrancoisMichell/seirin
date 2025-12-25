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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { IncludeInactiveDto } from 'src/common/dto/include-inactive.dto';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  findAll(@Query() query: IncludeInactiveDto) {
    return this.classesService.findAll(query.includeInactive);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.update(id, updateClassDto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.deactivate(id);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.activate(id);
  }

  @Post(':id/enroll/:studentId')
  enrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.classesService.enrollStudent(id, studentId);
  }

  @Delete(':id/enroll/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unenrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.classesService.unenrollStudent(id, studentId);
  }
}
