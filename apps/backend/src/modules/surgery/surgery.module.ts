import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Surgery } from '../../entities/surgery.entity';
import { SurgeryService } from './surgery.service';
import { SurgeryController } from './surgery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Surgery])],
  controllers: [SurgeryController],
  providers: [SurgeryService],
  exports: [SurgeryService],
})
export class SurgeryModule {}
