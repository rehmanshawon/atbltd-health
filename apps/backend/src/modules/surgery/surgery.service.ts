import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Surgery } from '../../entities/surgery.entity';

@Injectable()
export class SurgeryService {
  constructor(
    @InjectRepository(Surgery)
    private readonly surgeryRepository: Repository<Surgery>,
  ) {}

  async findAll(coveredOnly: boolean = false): Promise<Surgery[]> {
    const where: any = { isActive: true };
    if (coveredOnly) where.isCovered = true;

    return this.surgeryRepository.find({
      where,
      order: { sortOrder: 'ASC', nameEn: 'ASC' },
    });
  }

  async findById(id: string): Promise<Surgery | null> {
    return this.surgeryRepository.findOne({ where: { id } });
  }
}
