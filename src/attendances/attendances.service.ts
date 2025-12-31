import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Attendance } from './entities/attendance.entity';
import { UsersService } from 'src/users/users.service';
import { ClassesService } from 'src/classes/classes.service';
import { ClassSessionsService } from 'src/class-sessions/class-sessions.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityUtil } from 'src/common/utils/entity.util';
import { AttendanceStatus } from 'src/common/enums';
import { PaginatedResponse } from 'src/common/interfaces';

const CHECKED_IN_STATUSES = [
  AttendanceStatus.PRESENT.toString(),
  AttendanceStatus.LATE.toString(),
];

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private classSessionsService: ClassSessionsService,
    private classService: ClassesService,
    private usersService: UsersService,
  ) {}

  async create(createAttendanceDto: CreateAttendanceDto) {
    try {
      const session = await this.classSessionsService.findOne(
        createAttendanceDto.sessionId,
      );

      EntityUtil.ensureActive(
        session,
        'Cannot record attendance for an inactive class session',
      );

      const student = await this.usersService.getStudent(
        createAttendanceDto.studentId,
      );

      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          session: { id: createAttendanceDto.sessionId },
          student: { id: createAttendanceDto.studentId },
        },
      });

      if (existingAttendance) {
        throw new BadRequestException(
          'Attendance already recorded for this student in this session',
        );
      }

      const classEntity = await this.classService.findOne(session.class.id);
      const isEnrolledClass = classEntity.enrolledStudents.some(
        (s) => s.id === createAttendanceDto.studentId,
      );

      const attendanceStatus =
        createAttendanceDto.status || AttendanceStatus.PRESENT;
      const attendance = this.attendanceRepository.create({
        session,
        student,
        isEnrolledClass,
        notes: createAttendanceDto.notes,
        status: attendanceStatus,
        checkedInAt: CHECKED_IN_STATUSES.includes(attendanceStatus)
          ? new Date()
          : undefined,
      });

      return this.attendanceRepository.save(attendance);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create attendance');
    }
  }

  async bulkCreate(sessionId: string) {
    try {
      return this.attendanceRepository.manager.transaction(async (manager) => {
        const session = await this.classSessionsService.findOne(sessionId);

        EntityUtil.ensureActive(
          session,
          'Cannot record attendance for an inactive class session',
        );

        const classEntity = await this.classService.findOne(session.class.id);

        if (!classEntity.enrolledStudents.length) {
          throw new BadRequestException(
            'No students enrolled in the class to record attendance for',
          );
        }

        const existingAttendances = await manager.find(Attendance, {
          where: { session: { id: sessionId } },
          relations: ['student'],
        });

        const existingStudentIds = new Set(
          existingAttendances.map((a) => a.student.id),
        );

        const newStudents = classEntity.enrolledStudents.filter(
          (student) => !existingStudentIds.has(student.id),
        );

        if (newStudents.length === 0) {
          return [];
        }

        const attendances = newStudents.map((student) =>
          this.attendanceRepository.create({
            session,
            student,
            isEnrolledClass: true,
            status: AttendanceStatus.PENDING,
            checkedInAt: null,
          }),
        );

        return manager.save(Attendance, attendances);
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create attendances');
    }
  }

  findAll(filters?: {
    sessionId?: string;
    studentId?: string;
    status?: AttendanceStatus;
    isEnrolledClass?: boolean;
  }) {
    const query: {
      relations: string[];
      where: Record<
        string,
        string | boolean | { id: string } | Date | null | undefined
      >;
    } = {
      relations: ['session', 'session.class', 'student'],
      where: {},
    };

    if (filters) {
      if (filters.sessionId) {
        query.where.session = { id: filters.sessionId };
      }

      if (filters.studentId) {
        query.where.student = { id: filters.studentId };
      }

      if (filters.status) {
        query.where.status = filters.status;
      }

      if (filters.isEnrolledClass !== undefined) {
        query.where.isEnrolledClass = filters.isEnrolledClass;
      }
    }

    return this.attendanceRepository.find(query);
  }

  async findOne(id: string) {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['session', 'session.class', 'student'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async findBySession(sessionId: string) {
    await this.classSessionsService.findOne(sessionId);

    return this.attendanceRepository.find({
      where: { session: { id: sessionId } },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByStudent(
    studentId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Attendance>> {
    await this.usersService.getStudent(studentId);

    const skip = (page - 1) * limit;

    const [data, total] = await this.attendanceRepository.findAndCount({
      where: { student: { id: studentId } },
      relations: ['session', 'session.class'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    const attendance = await this.findOne(id);
    const shouldCheckIn = CHECKED_IN_STATUSES.includes(
      updateAttendanceDto.status || '',
    );

    if (!shouldCheckIn) {
      attendance.checkedInAt = null;
    } else {
      if (!attendance.checkedInAt) {
        attendance.checkedInAt = new Date();
      }
    }

    EntityUtil.updateFields(attendance, updateAttendanceDto, [
      'sessionId',
      'studentId',
    ]);

    return this.attendanceRepository.save(attendance);
  }

  async markPresent(id: string) {
    const attendance = await this.findOne(id);

    attendance.status = AttendanceStatus.PRESENT;
    attendance.checkedInAt = new Date();

    return this.attendanceRepository.save(attendance);
  }

  async markLate(id: string) {
    const attendance = await this.findOne(id);

    attendance.status = AttendanceStatus.LATE;
    attendance.checkedInAt = new Date();

    return this.attendanceRepository.save(attendance);
  }

  async markAbsent(id: string) {
    const attendance = await this.findOne(id);

    attendance.status = AttendanceStatus.ABSENT;
    attendance.checkedInAt = null;

    return this.attendanceRepository.save(attendance);
  }

  async markExcused(id: string) {
    const attendance = await this.findOne(id);

    attendance.status = AttendanceStatus.EXCUSED;
    attendance.checkedInAt = null;

    return this.attendanceRepository.save(attendance);
  }

  async remove(id: string) {
    const attendance = await this.findOne(id);

    return this.attendanceRepository.remove(attendance);
  }
}
