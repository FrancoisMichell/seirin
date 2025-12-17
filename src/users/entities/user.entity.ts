import { Belt } from '../../common/enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  registry: string | null;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({
    type: 'enum',
    enum: Belt,
    default: Belt.White,
  })
  belt: Belt;

  @Column({
    name: 'birthday',
    type: 'date',
    nullable: true,
  })
  birthday: Date | null;

  @Column({
    name: 'training_since',
    type: 'date',
    nullable: true,
  })
  trainingSince: Date | null;

  @Column({
    name: 'is_active',
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @OneToMany(() => UserRole, (role) => role.user, { cascade: true })
  roles: UserRole[];
}
