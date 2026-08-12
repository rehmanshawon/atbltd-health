import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('hospitals')
@UseGuards(JwtAuthGuard)
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get()
  async findAll(@Query('partners') partners?: string) {
    return this.hospitalService.findAll(partners === 'true');
  }
}
