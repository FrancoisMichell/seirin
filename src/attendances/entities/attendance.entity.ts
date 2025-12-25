import { ClassSession } from '../../class-sessions/entities/class-session.entity';
import { AttendanceStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'is_enrolled_class', default: true })
  isEnrolledClass: boolean;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PENDING,
  })
  status: AttendanceStatus;

  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ClassSession, (session) => session.attendances, {
    onDelete: 'CASCADE',
  })
  session: ClassSession;

  @ManyToOne(() => User, (user) => user.attendances, { onDelete: 'RESTRICT' })
  student: User;
}
