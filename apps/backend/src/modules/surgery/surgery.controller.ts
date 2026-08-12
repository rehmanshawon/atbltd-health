import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SurgeryService } from './surgery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('surgeries')
@UseGuards(JwtAuthGuard)
export class SurgeryController {
  constructor(private readonly surgeryService: SurgeryService) {}

  @Get()
  async findAll(@Query('covered') covered?: string) {
    return this.surgeryService.findAll(covered === 'true');
  }
}
