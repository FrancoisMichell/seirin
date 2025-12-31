import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { PostgresErrorCode } from 'src/common/constants/postgres-error-codes';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOperator,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { ClassesService } from 'src/classes/classes.service';
import { UsersService } from 'src/users/users.service';
import { ClassSession } from './entities/class-session.entity';
import { EntityUtil } from 'src/common/utils/entity.util';

@Injectable()
export class ClassSessionsService {
  constructor(
    @InjectRepository(ClassSession)
    private sessionsRepository: Repository<ClassSession>,
    private classesService: ClassesService,
    private usersService: UsersService,
  ) {}

  async create(createClassSessionDto: CreateClassSessionDto) {
    try {
      const classEntity = await this.classesService.findOne(
        createClassSessionDto.classId,
      );

      EntityUtil.ensureActive(
        classEntity,
        'Cannot create session for an inactive class',
      );

      const teacher = await this.usersService.getTeacher(
        createClassSessionDto.teacherId,
      );

      const existingSession = await this.sessionsRepository.findOne({
        where: {
          date: createClassSessionDto.date,
          class: { id: createClassSessionDto.classId },
        },
      });

      if (existingSession) {
        throw new BadRequestException(
          'A session for this class on the specified date already exists',
        );
      }

      const session = this.sessionsRepository.create({
        ...createClassSessionDto,
        teacher,
        class: classEntity,
      });

      return this.sessionsRepository.save(session);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new BadRequestException(
          'A session with this information already exists',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestException('Invalid class or teacher reference');
      }
      throw new BadRequestException('Failed to create class session');
    }
  }

  async findAll(filters?: {
    classId?: string;
    teacherId?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }): Promise<ClassSession[]> {
    const query: {
      relations: string[];
      where: Record<
        string,
        | string
        | boolean
        | { id: string }
        | Date
        | FindOperator<Date>
        | null
        | undefined
      >;
    } = {
      relations: ['class', 'teacher'],
      where: {},
    };

    if (filters) {
      if (filters.classId) {
        query.where.class = { id: filters.classId };
      }

      if (filters.teacherId) {
        query.where.teacher = { id: filters.teacherId };
      }

      if (filters.startDate && filters.endDate) {
        query.where.date = Between(filters.startDate, filters.endDate);
      } else if (filters.startDate) {
        query.where.date = MoreThanOrEqual(filters.startDate);
      } else if (filters.endDate) {
        query.where.date = LessThanOrEqual(filters.endDate);
      }

      if (filters.isActive !== undefined) {
        query.where.isActive = filters.isActive;
      }
    }
    return this.sessionsRepository.find(query);
  }

  async findOne(id: string) {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['class', 'teacher'],
    });

    if (!session) {
      throw new NotFoundException(`Class session with ID ${id} not found`);
    }

    return session;
  }

  async findByClass(classId: string, includeInactive = false) {
    const where: { class: { id: string }; isActive?: boolean } = {
      class: { id: classId },
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.sessionsRepository.find({
      where,
      relations: ['class', 'teacher'],
      order: { date: 'DESC' },
    });
  }

  async findByTeacher(teacherId: string, includeInactive = false) {
    const where: { teacher: { id: string }; isActive?: boolean } = {
      teacher: { id: teacherId },
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.sessionsRepository.find({
      where,
      relations: ['class', 'teacher'],
      order: { date: 'DESC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    includeInactive = false,
  ) {
    return this.sessionsRepository.find({
      where: {
        date: Between(startDate, endDate),
        isActive: includeInactive ? undefined : true,
      },
      relations: ['class', 'teacher'],
      order: { date: 'DESC' },
    });
  }

  async update(id: string, updateClassSessionDto: UpdateClassSessionDto) {
    try {
      const session = await this.findOne(id);

      if (updateClassSessionDto.teacherId) {
        const teacher = await this.usersService.getTeacher(
          updateClassSessionDto.teacherId,
        );
        session.teacher = teacher;
      }

      if (updateClassSessionDto.classId) {
        const classEntity = await this.classesService.findOne(
          updateClassSessionDto.classId,
        );

        EntityUtil.ensureActive(
          classEntity,
          'Cannot assign session to an inactive class',
        );
        session.class = classEntity;
      }

      EntityUtil.updateFields(session, updateClassSessionDto, [
        'teacherId',
        'classId',
      ]);

      return this.sessionsRepository.save(session);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.UNIQUE_VIOLATION) {
        throw new BadRequestException(
          'A session with this information already exists',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error?.code === PostgresErrorCode.FOREIGN_KEY_VIOLATION) {
        throw new BadRequestException('Invalid class or teacher reference');
      }
      throw new BadRequestException('Failed to update class session');
    }
  }

  async activate(id: string) {
    const session = await this.findOne(id);
    return EntityUtil.toggleActive(session, this.sessionsRepository, true);
  }

  async deactivate(id: string) {
    const session = await this.findOne(id);
    return EntityUtil.toggleActive(session, this.sessionsRepository, false);
  }

  async remove(id: string) {
    const session = await this.findOne(id);
    await this.sessionsRepository.remove(session);
  }

  async start(id: string) {
    const session = await this.findOne(id);
    if (session.startTime) {
      throw new BadRequestException('Session has already been started');
    }

    session.startTime = new Date().toISOString().slice(11, 19); // HH:MM:SS format
    return this.sessionsRepository.save(session);
  }

  async end(id: string) {
    const session = await this.findOne(id);
    if (!session.startTime) {
      throw new BadRequestException('Session has not been started yet');
    }

    if (session.endTime) {
      throw new BadRequestException('Session has already been ended');
    }

    session.endTime = new Date().toISOString().slice(11, 19); // HH:MM:SS format
    return this.sessionsRepository.save(session);
  }
}
