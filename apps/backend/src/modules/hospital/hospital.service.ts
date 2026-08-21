import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Hospital } from '../../entities/hospital.entity';
import { Claim } from '../../entities/claim.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { ClaimDocument } from '../../entities/claim-document.entity';
@Injectable()
export class HospitalService {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(ClaimDocument)
    private readonly claimDocumentRepository: Repository<ClaimDocument>,
  ) {}

  /**
   * Hospital login
   */
  async hospitalLogin(
    loginId: string,
    password: string,
  ): Promise<{
    accessToken: string;
    hospital: { id: string; name: string; loginId: string };
  }> {
    const hospital = await this.hospitalRepository.findOne({
      where: { loginId, isActive: true, isPartner: true },
    });

    if (!hospital) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, hospital.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // In production, use JWT for hospital as well
    // For now, return a simple token
    const accessToken = Buffer.from(
      JSON.stringify({
        hospitalId: hospital.id,
        name: hospital.name,
        role: 'hospital',
      }),
    ).toString('base64');

    return {
      accessToken,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        loginId: hospital.loginId,
      },
    };
  }

  /**
   * Get claims assigned to this hospital for verification
   */
  async getHospitalClaims(hospitalId: string): Promise<Claim[]> {
    return this.claimRepository.find({
      where: { status: ClaimStatus.HOSPITAL_VERIFICATION },
      order: { createdAt: 'DESC' },
      relations: ['member'],
    });
  }

  /**
   * Hospital verifies a claim (approve or reject)
   */
  async verifyClaim(
    claimId: string,
    hospitalId: string,
    decision: 'verified' | 'rejected',
    notes: string,
  ): Promise<Claim> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId, status: ClaimStatus.HOSPITAL_VERIFICATION },
    });

    if (!claim) {
      throw new NotFoundException(
        'Claim not found or not in hospital verification stage',
      );
    }

    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    claim.hospitalVerifiedBy = hospitalId;
    claim.hospitalVerifiedAt = new Date();
    claim.notes = notes || claim.notes;

    if (decision === 'verified') {
      // Move back to under_review for ATB final review
      claim.status = ClaimStatus.UNDER_REVIEW;
    } else {
      // Hospital rejects — claim goes back with note
      claim.status = ClaimStatus.REJECTED;
      claim.rejectionReason = `Hospital verification failed: ${
        notes || 'No reason provided'
      }`;
    }

    const updatedClaim = await this.claimRepository.save(claim);

    await this.auditLogRepository.save({
      action: `HOSPITAL_${decision.toUpperCase()}`,
      entity: 'Claim',
      entityId: claimId,
      performedById: hospitalId,
      newValue: { decision, notes, hospitalName: hospital.name },
    });

    return updatedClaim;
  }

  async getClaimDocuments(claimId: string, hospitalId: string): Promise<any[]> {
    const claim = await this.claimRepository.findOne({
      where: { id: claimId, hospitalVerifiedBy: hospitalId },
    });

    if (!claim) {
      // Check if claim is assigned to this hospital
      const unassigned = await this.claimRepository.findOne({
        where: { id: claimId, status: ClaimStatus.HOSPITAL_VERIFICATION },
      });
      if (!unassigned) throw new NotFoundException('Claim not found');
    }

    return this.claimDocumentRepository.find({
      where: { claimId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Admin: Create hospital account
   */
  async createHospital(
    data: {
      name: string;
      address: string;
      contactNumber: string;
      email?: string;
      contactPerson?: string;
      loginId: string;
      password: string;
      isPartner: boolean;
    },
    adminId: string,
  ): Promise<Hospital> {
    // Check duplicate loginId
    const existing = await this.hospitalRepository.findOne({
      where: { loginId: data.loginId },
    });
    if (existing) {
      throw new BadRequestException('Login ID already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const hospital = this.hospitalRepository.create({
      name: data.name,
      address: data.address,
      contactNumber: data.contactNumber,
      email: data.email,
      contactPerson: data.contactPerson,
      loginId: data.loginId,
      password: hashedPassword,
      isPartner: data.isPartner,
      isActive: true,
    });

    const saved = await this.hospitalRepository.save(hospital);

    await this.auditLogRepository.save({
      action: 'HOSPITAL_CREATED',
      entity: 'Hospital',
      entityId: saved.id,
      performedById: adminId,
      newValue: {
        name: saved.name,
        loginId: saved.loginId,
        isPartner: saved.isPartner,
      },
    });

    return saved;
  }

  /**
   * Admin: Get all hospitals
   */
  async getAllHospitals(): Promise<Hospital[]> {
    return this.hospitalRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Admin: Deactivate hospital
   */
  async deactivateHospital(hospitalId: string, adminId: string): Promise<void> {
    const hospital = await this.hospitalRepository.findOne({
      where: { id: hospitalId },
    });

    if (!hospital) throw new NotFoundException('Hospital not found');

    hospital.isActive = false;
    await this.hospitalRepository.save(hospital);

    await this.auditLogRepository.save({
      action: 'HOSPITAL_DEACTIVATED',
      entity: 'Hospital',
      entityId: hospitalId,
      performedById: adminId,
    });
  }
}
