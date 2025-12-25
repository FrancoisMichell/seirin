import { ClassSession } from 'src/class-sessions/entities/class-session.entity';
import { User } from 'src/users/entities/user.entity';
import { DayOfWeek } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'simple-array' })
  days: DayOfWeek[];

  @Column({ type: 'time' })
  startTime: string;

  @Column()
  durationMinutes: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (teacher) => teacher.classes, { onDelete: 'RESTRICT' })
  teacher: User;

  @ManyToMany(() => User, (user) => user.enrolledClasses)
  @JoinTable({
    name: 'class_enrollments',
    joinColumn: {
      name: 'class_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  enrolledStudents: User[];

  @OneToMany(() => ClassSession, (session) => session.class)
  sessions: ClassSession[];
}
