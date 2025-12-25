import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { Attendance } from './entities/attendance.entity';
import { ClassSessionsModule } from 'src/class-sessions/class-sessions.module';
import { ClassesModule } from 'src/classes/classes.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    ClassSessionsModule,
    ClassesModule,
    UsersModule,
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
