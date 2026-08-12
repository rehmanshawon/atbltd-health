import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospital } from '../../entities/hospital.entity';

@Injectable()
export class HospitalService {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {}

  async findAll(partnersOnly: boolean = false): Promise<Hospital[]> {
    const where: any = { isActive: true };
    if (partnersOnly) where.isPartner = true;

    return this.hospitalRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Hospital | null> {
    return this.hospitalRepository.findOne({ where: { id } });
  }
}
