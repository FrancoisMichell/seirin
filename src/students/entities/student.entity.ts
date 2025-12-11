import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Belt } from '../../common/enums';

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    name: 'is_active',
    default: true,
  })
  isActive: boolean;

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
  birthday: Date;

  @Column({
    name: 'training_since',
    type: 'date',
    nullable: true,
  })
  trainingSince: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
