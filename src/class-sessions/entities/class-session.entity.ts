import { Attendance } from '../../attendances/entities/attendance.entity';
import { Class } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('class_sessions')
export class ClassSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Class, (classEntity) => classEntity.sessions, {
    onDelete: 'RESTRICT',
  })
  class: Class;

  @ManyToOne(() => User, (teacher) => teacher.sessions, {
    onDelete: 'RESTRICT',
  })
  teacher: User;

  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances: Attendance[];
}
