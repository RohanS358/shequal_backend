import { Module } from '@nestjs/common'
import { LessonsService } from './lessons.service'
import { LessonsController } from './lessons.controller'
import { StudentsModule } from '../students/students.module'

@Module({
  imports: [StudentsModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
