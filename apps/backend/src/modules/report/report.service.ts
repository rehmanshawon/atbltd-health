import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Claim } from '../../entities/claim.entity';
import { Agent } from '../../entities/agent.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async generateMemberReport(userRole: string): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {});

    // Header
    doc.fontSize(20).fillColor('#0A2A5E').text('ATB Ltd — Member Report', { align: 'center' });
    doc.moveDown();
    doc
      .fontSize(10)
      .fillColor('#666')
      .text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(2);

    // Stats
    const totalMembers = await this.userRepository.count({ where: { role: UserRole.MEMBER } });
    const activeMembers = await this.userRepository.count({
      where: { role: UserRole.MEMBER, isActive: true },
    });
    const newThisMonth = await this.userRepository.count({
      where: {
        role: UserRole.MEMBER,
        createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    doc.fontSize(12).fillColor('#000').text(`Total Members: ${totalMembers}`);
    doc.text(`Active Members: ${activeMembers}`);
    doc.text(`Inactive Members: ${totalMembers - activeMembers}`);
    doc.text(`New This Month: ${newThisMonth}`);
    doc.moveDown(2);

    // Member List
    const members = await this.userRepository.find({
      where: { role: UserRole.MEMBER },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    doc.fontSize(12).fillColor('#0A2A5E').text('Recent Members (Last 100)');
    doc.moveDown();

    // Table headers
    let y = doc.y;
    doc.fontSize(9).fillColor('#333');
    doc.text('Member ID', 40, y);
    doc.text('Name', 140, y);
    doc.text('Mobile', 240, y);
    doc.text('Status', 340, y);
    doc.text('Joined', 420, y);

    doc.moveDown();

    members.forEach((member) => {
      y = doc.y;
      doc.fontSize(8).fillColor('#444');
      doc.text(member.memberId, 40, y);
      doc.text(member.fullName.substring(0, 25), 140, y);
      doc.text(member.mobileNumber, 240, y);
      doc.text(member.isActive ? 'Active' : 'Inactive', 340, y);
      doc.text(member.createdAt.toLocaleDateString('en-GB'), 420, y);
      doc.moveDown();
    });

    doc.end();

    return Buffer.concat(chunks);
  }

  async generatePaymentReport(): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc
      .fontSize(20)
      .fillColor('#0A2A5E')
      .text('ATB Ltd — Payment Collection Report', { align: 'center' });
    doc.moveDown();

    const payments = await this.paymentRepository.find({
      where: { status: 'verified' as any },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const totalCollection = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    doc
      .fontSize(12)
      .fillColor('#000')
      .text(`Total Collection: ${totalCollection.toLocaleString()} BDT`);
    doc.text(`Total Transactions: ${payments.length}`);
    doc.moveDown(2);

    // Table
    doc.fontSize(9).fillColor('#333');
    doc.text('Member', 40, doc.y);
    doc.text('Method', 180, doc.y);
    doc.text('Amount', 260, doc.y);
    doc.text('Date', 340, doc.y);
    doc.text('TXN ID', 420, doc.y);
    doc.moveDown();

    payments.forEach((payment) => {
      const y = doc.y;
      doc.fontSize(8).fillColor('#444');
      doc.text(payment.user?.fullName?.substring(0, 20) || 'N/A', 40, y);
      doc.text(payment.method, 180, y);
      doc.text(`${Number(payment.amount).toLocaleString()} BDT`, 260, y);
      doc.text(payment.createdAt.toLocaleDateString('en-GB'), 340, y);
      doc.text(payment.transactionId || '—', 420, y);
      doc.moveDown();
    });

    doc.end();
    return Buffer.concat(chunks);
  }

  async generateClaimReport(): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc
      .fontSize(20)
      .fillColor('#0A2A5E')
      .text('ATB Ltd — Benefit Application Report', { align: 'center' });
    doc.moveDown();

    const claims = await this.claimRepository.find({
      relations: ['member'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const totalClaims = claims.length;
    const approved = claims.filter((c) => c.status === 'approved').length;
    const rejected = claims.filter((c) => c.status === 'rejected').length;
    const pending = claims.filter(
      (c) => c.status === 'submitted' || c.status === 'under_review',
    ).length;

    doc.fontSize(12).fillColor('#000').text(`Total Applications: ${totalClaims}`);
    doc.text(`Approved: ${approved}`);
    doc.text(`Rejected: ${rejected}`);
    doc.text(`Pending: ${pending}`);
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#333');
    doc.text('Member', 40, doc.y);
    doc.text('Surgery', 160, doc.y);
    doc.text('Hospital', 260, doc.y);
    doc.text('Amount', 380, doc.y);
    doc.text('Status', 460, doc.y);
    doc.moveDown();

    claims.forEach((claim) => {
      const y = doc.y;
      doc.fontSize(8).fillColor('#444');
      doc.text(claim.member?.fullName?.substring(0, 18) || 'N/A', 40, y);
      doc.text(claim.surgeryType.substring(0, 20), 160, y);
      doc.text(claim.hospitalName.substring(0, 20), 260, y);
      doc.text(`${Number(claim.claimedAmount).toLocaleString()} BDT`, 380, y);
      doc.text(claim.status.replace(/_/g, ' '), 460, y);
      doc.moveDown();
    });

    doc.end();
    return Buffer.concat(chunks);
  }

  async generateAgentReport(): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc
      .fontSize(20)
      .fillColor('#0A2A5E')
      .text('ATB Ltd — Agent Performance Report', { align: 'center' });
    doc.moveDown();

    const agents = await this.agentRepository.find({
      relations: ['user'],
      order: { totalMembersRegistered: 'DESC' },
    });

    doc.fontSize(9).fillColor('#333');
    doc.text('Agent Code', 40, doc.y);
    doc.text('Name', 140, doc.y);
    doc.text('Commission %', 240, doc.y);
    doc.text('Members', 320, doc.y);
    doc.text('Earned', 400, doc.y);
    doc.text('Paid', 470, doc.y);
    doc.moveDown();

    agents.forEach((agent) => {
      const y = doc.y;
      doc.fontSize(8).fillColor('#444');
      doc.text(agent.agentCode, 40, y);
      doc.text(agent.user?.fullName?.substring(0, 20) || 'N/A', 140, y);
      doc.text(`${agent.commissionRate}%`, 240, y);
      doc.text(`${agent.totalMembersRegistered}`, 320, y);
      doc.text(`${Number(agent.totalCommissionEarned).toLocaleString()} BDT`, 400, y);
      doc.text(`${Number(agent.totalCommissionPaid).toLocaleString()} BDT`, 470, y);
      doc.moveDown();
    });

    doc.end();
    return Buffer.concat(chunks);
  }

  async generateAuditReport(): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(20).fillColor('#0A2A5E').text('ATB Ltd — Audit Log Report', { align: 'center' });
    doc.moveDown();

    const logs = await this.auditLogRepository.find({
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 200,
    });

    doc.fontSize(9).fillColor('#333');
    doc.text('Action', 40, doc.y);
    doc.text('Performed By', 200, doc.y);
    doc.text('Entity', 320, doc.y);
    doc.text('Date', 400, doc.y);
    doc.moveDown();

    logs.forEach((log) => {
      const y = doc.y;
      doc.fontSize(7).fillColor('#444');
      doc.text(log.action.substring(0, 25), 40, y);
      doc.text(log.performedBy?.fullName?.substring(0, 20) || 'System', 200, y);
      doc.text(log.entity.substring(0, 15), 320, y);
      doc.text(log.createdAt.toLocaleString('en-GB'), 400, y);
      doc.moveDown();
    });

    doc.end();
    return Buffer.concat(chunks);
  }
}
