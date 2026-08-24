import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { Membership } from '../entities/membership.entity';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../entities/payment.entity';
import { Agent } from '../entities/agent.entity';
import { Surgery } from '../entities/surgery.entity';
import { Hospital } from '../entities/hospital.entity';

async function bootstrap() {
  console.log('🌱 Starting database seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Check if admin already exists
  const existingAdmin = await dataSource.manager.findOne(User, {
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists. Skipping seed.');
    await app.close();
    return;
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ============================================================
    // 1. Create Super Admin
    // ============================================================
    const superAdminPassword = await bcrypt.hash('Admin@ATB2026', 12);

    const superAdmin = queryRunner.manager.create(User, {
      memberId: 'ATB-26-SA-1',
      fullName: 'System Administrator',
      mobileNumber: '01700000000',
      email: 'admin@atbltd.health',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isKycVerified: true,
      permanentAddress: 'ATB Headquarters, Uttara, Dhaka',
    });

    const savedSuperAdmin = await queryRunner.manager.save(superAdmin);
    console.log(`✅ Super Admin created: ${savedSuperAdmin.memberId}`);

    // ============================================================
    // 2. Create Second Admin
    // ============================================================
    const secondAdminPassword = await bcrypt.hash('Admin2@ATB2026', 12);

    const secondAdmin = queryRunner.manager.create(User, {
      memberId: 'ATB-26-AD-1',
      fullName: 'Finance Manager',
      mobileNumber: '01700000001',
      email: 'finance@atbltd.health',
      password: secondAdminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isKycVerified: true,
      permanentAddress: 'ATB Headquarters, Uttara, Dhaka',
    });

    const savedSecondAdmin = await queryRunner.manager.save(secondAdmin);
    console.log(`✅ Second Admin created: ${savedSecondAdmin.memberId}`);

    // ============================================================
    // 3. Create an Owner
    // ============================================================
    const ownerPassword = await bcrypt.hash('Owner@ATB2026', 12);

    const owner = queryRunner.manager.create(User, {
      memberId: 'ATB-26-OW-1',
      fullName: 'A.K.M. Moshiur Rahman',
      mobileNumber: '01711993597',
      email: 'chairman@atbltd.health',
      password: ownerPassword,
      role: UserRole.OWNER,
      isActive: true,
      isKycVerified: true,
      permanentAddress:
        'Lane 08, House 02, Road 11, Sector 06, Uttara, Dhaka-1270',
    });

    const savedOwner = await queryRunner.manager.save(owner);
    console.log(`✅ Owner created: ${savedOwner.memberId}`);

    // Create Agent record for the Owner (so they can manage agent network)
    const ownerAgent = queryRunner.manager.create(Agent, {
      userId: savedOwner.id,
      agentCode: 'ATB-26-OW-1',
      commissionRate: 15.0, // 15% - direct acquisition rate per agenda
      isActive: true,
      createdBy: savedSuperAdmin.memberId, // 'ATB-26-SA-1'
      createdByName: savedSuperAdmin.fullName, // 'System Administrator'
      createdByRole: 'super_admin',
    });

    await queryRunner.manager.save(ownerAgent);
    console.log(`✅ Owner agent record created: ${ownerAgent.agentCode}`);

    // ============================================================
    // 4. Create a Sample Agent
    // ============================================================
    const agentPassword = await bcrypt.hash('Agent@ATB2026', 12);

    const agentUser = queryRunner.manager.create(User, {
      memberId: 'ATB-26-AG-1',
      fullName: 'Sample Agent',
      mobileNumber: '01710000001',
      email: 'agent@atbltd.health',
      password: agentPassword,
      role: UserRole.AGENT,
      isActive: true,
      isKycVerified: true,
      permanentAddress: 'Dhaka, Bangladesh',
    });

    const savedAgentUser = await queryRunner.manager.save(agentUser);

    // Create Agent record
    const agent = queryRunner.manager.create(Agent, {
      userId: savedAgentUser.id,
      agentCode: 'ATB-26-AG-1',
      commissionRate: 10.0, // 10% - standard agent rate per agenda
      parentAgentId: null,
      isActive: true,
      createdBy: savedSuperAdmin.memberId,
      createdByName: savedSuperAdmin.fullName,
      createdByRole: 'super_admin',
    });

    await queryRunner.manager.save(agent);
    console.log(`✅ Agent created: ${agent.agentCode}`);

    // ============================================================
    // 5. Create a Sample Member (fully activated)
    // ============================================================
    const memberPassword = await bcrypt.hash('Member@ATB2026', 12);

    const member = queryRunner.manager.create(User, {
      memberId: 'ATB-26-ME-01',
      fullName: 'Sample Member',
      fatherName: 'Sample Father',
      motherName: 'Sample Mother',
      dateOfBirth: new Date('1990-01-15'),
      nid: '1234567890',
      mobileNumber: '01710000002',
      email: 'member@example.com',
      password: memberPassword,
      role: UserRole.MEMBER,
      isActive: true,
      isKycVerified: true,
      permanentAddress: '123 Sample Street, Dhaka',
      currentAddress: '123 Sample Street, Dhaka',
      emergencyContact: '01710000003',
      referralId: 'ATB-26-AG-1', // Referred by the sample agent
    });

    const savedMember = await queryRunner.manager.save(member);
    console.log(`✅ Member created: ${savedMember.memberId}`);

    // Create Membership for the sample member
    const membership = queryRunner.manager.create(Membership, {
      userId: savedMember.id,
      membershipFee: 1000.0,
      isPaymentVerified: true,
      paymentMethod: 'bkash',
      transactionId: 'TXNSAMPLE001',
      paymentVerifiedBy: savedSuperAdmin.id,
      paymentVerifiedAt: new Date(),
      membershipStartDate: new Date('2026-06-01'),
      membershipEndDate: new Date('2027-06-01'),
      isActive: true,
      remainingBenefit: 12000.0,
      renewalFee: 850.0,
    });

    await queryRunner.manager.save(membership);
    console.log(`✅ Membership activated for ${savedMember.memberId}`);

    // Create Payment record for the sample member
    const payment = queryRunner.manager.create(Payment, {
      userId: savedMember.id,
      paymentType: PaymentType.MEMBERSHIP_FEE,
      amount: 1000.0,
      method: 'bkash',
      transactionId: 'TXNSAMPLE001',
      senderAccount: '01710000002',
      recipientAccount: '01721719611', // ATB Official bKash
      status: PaymentStatus.VERIFIED,
      verifiedBy: savedSuperAdmin.id,
      verifiedAt: new Date(),
    });

    await queryRunner.manager.save(payment);
    console.log(`✅ Payment recorded for ${savedMember.memberId}`);

    // Update agent's registration count
    agent.totalMembersRegistered += 1;
    agent.activeMembers += 1;
    await queryRunner.manager.save(agent);

    // ============================================================
    // 6. Seed Surgeries (Covered Diseases List)
    // ============================================================
    const surgeries = [
      {
        nameEn: 'Dengue Fever',
        nameBn: 'ডেঙ্গু জ্বর',
        category: 'General Medicine',
      },
      {
        nameEn: 'Chikungunya',
        nameBn: 'চিকুনগুনিয়া',
        category: 'General Medicine',
      },
      { nameEn: 'Pneumonia', nameBn: 'নিউমোনিয়া', category: 'Respiratory' },
      { nameEn: 'Typhoid', nameBn: 'টাইফয়েড', category: 'General Medicine' },
      {
        nameEn: 'Severe Diarrhea',
        nameBn: 'ডায়রিয়া (গুরুতর)',
        category: 'General Medicine',
      },
      { nameEn: 'Cholera', nameBn: 'কলেরা', category: 'General Medicine' },
      {
        nameEn: 'Malaria',
        nameBn: 'ম্যালেরিয়া',
        category: 'General Medicine',
      },
      { nameEn: 'Jaundice', nameBn: 'জন্ডিস', category: 'General Medicine' },
      {
        nameEn: 'Kidney-related Complications',
        nameBn: 'কিডনি সংক্রান্ত জটিলতা',
        category: 'Urology',
      },
      {
        nameEn: 'Liver Disease',
        nameBn: 'লিভারের রোগ',
        category: 'Gastroenterology',
      },
      {
        nameEn: 'Respiratory Disease',
        nameBn: 'শ্বাসকষ্টজনিত রোগ',
        category: 'Respiratory',
      },
      {
        nameEn: 'Asthma Complications',
        nameBn: 'হাঁপানি (Asthma) জটিলতা',
        category: 'Respiratory',
      },
      {
        nameEn: 'Diabetes-related Complications',
        nameBn: 'ডায়াবেটিসজনিত জটিলতা',
        category: 'Endocrinology',
      },
      {
        nameEn: 'High Blood Pressure Complications',
        nameBn: 'উচ্চ রক্তচাপজনিত জটিলতা',
        category: 'Cardiology',
      },
      { nameEn: 'Stroke', nameBn: 'স্ট্রোক', category: 'Neurology' },
      {
        nameEn: 'Heart Attack',
        nameBn: 'হার্ট অ্যাটাক',
        category: 'Cardiology',
      },
      {
        nameEn: 'ICU Admission',
        nameBn: 'ICU-তে ভর্তি রোগী',
        category: 'Emergency',
      },
      {
        nameEn: 'Road Accident Injuries',
        nameBn: 'সড়ক দুর্ঘটনাজনিত আহত',
        category: 'Emergency',
      },
      {
        nameEn: 'Burn Injuries',
        nameBn: 'আগুনে দগ্ধ রোগী',
        category: 'Emergency',
      },
      {
        nameEn: 'Snake Bite & Rabies',
        nameBn: 'সাপে কাটা ও জলাতঙ্ক',
        category: 'Emergency',
      },
      {
        nameEn: 'Uterine Tumor Removal',
        nameBn: 'জরায়ুর টিউমার অপসারণ',
        category: 'Gynecology',
      },
      {
        nameEn: 'Fissure & Fistula Surgery',
        nameBn: 'ফিশার ও ফিস্টুলা সার্জারি',
        category: 'General Surgery',
      },
      {
        nameEn: 'Orthopedic & Trauma Surgery',
        nameBn: 'অর্থোপেডিক ও ট্রমা সার্জারি (হাড় ও জোড়ার চিকিৎসা)',
        category: 'Orthopedic',
      },
      {
        nameEn: 'Various Accident-related Surgeries',
        nameBn: 'দুর্ঘটনাজনিত বিভিন্ন অস্ত্রোপচার বা অপারেশন',
        category: 'Emergency',
      },
      { nameEn: 'Head Injury', nameBn: 'মাথায় আঘাত', category: 'Emergency' },
      { nameEn: 'Eye Injury', nameBn: 'চোখে আঘাত', category: 'Ophthalmology' },
      {
        nameEn: 'Laceration / Cut Wound',
        nameBn: 'কেটে যাওয়া',
        category: 'Emergency',
      },
      {
        nameEn: 'Road Accident',
        nameBn: 'রোড এক্সিডেন্ট',
        category: 'Emergency',
      },
      {
        nameEn: 'Electric Shock',
        nameBn: 'বিদ্যুৎ স্পৃষ্ট',
        category: 'Emergency',
      },
      {
        nameEn: 'Fall from Height',
        nameBn: 'ছাদ বা উঁচু স্থান থেকে পড়ে আঘাত',
        category: 'Emergency',
      },
      {
        nameEn: 'Respiratory Infection Surgery',
        nameBn: 'শ্বাস-প্রশ্বাস সমস্যা (শুধু ইনফেকশন অস্ত্রোপচার)',
        category: 'Respiratory',
      },
    ];

    for (let i = 0; i < surgeries.length; i++) {
      const s = surgeries[i];
      const surgery = queryRunner.manager.create(Surgery, {
        nameEn: s.nameEn,
        nameBn: s.nameBn,
        category: s.category,
        isCovered: true,
        waitingPeriodDays: 30,
        maxAssistance: 12000,
        sortOrder: i + 1,
        isActive: true,
      });
      await queryRunner.manager.save(surgery);
    }
    console.log(`✅ ${surgeries.length} surgeries seeded`);

    // ============================================================
    // 7. Seed Hospitals
    // ============================================================
    const hospitals = [
      {
        name: 'Dhaka Medical College Hospital',
        address: 'Secretariat Road, Dhaka',
        contact: '+880-2-55165000',
        isPartner: true,
      },
      {
        name: 'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
        address: 'Shahbagh, Dhaka',
        contact: '+880-2-55165000',
        isPartner: true,
      },
      {
        name: 'Square Hospital',
        address: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, Dhaka',
        contact: '+880-2-8144400',
        isPartner: true,
      },
      {
        name: 'United Hospital',
        address: 'Plot 15, Road 71, Gulshan, Dhaka',
        contact: '+880-2-8836000',
        isPartner: true,
      },
      {
        name: 'Apollo Hospitals Dhaka',
        address: 'Plot 81, Block E, Bashundhara, Dhaka',
        contact: '+880-2-55037242',
        isPartner: true,
      },
      {
        name: 'Evercare Hospital Dhaka',
        address: 'Plot 81, Block E, Bashundhara, Dhaka',
        contact: '+880-2-55037242',
        isPartner: true,
      },
      {
        name: 'Ibn Sina Hospital',
        address: 'House 48, Road 9/A, Dhanmondi, Dhaka',
        contact: '+880-2-8112345',
        isPartner: true,
      },
      {
        name: 'Labaid Specialized Hospital',
        address: 'House 06, Road 04, Dhanmondi, Dhaka',
        contact: '+880-2-9676356',
        isPartner: true,
      },
      {
        name: 'Popular Medical College Hospital',
        address: 'House 25, Road 2, Dhanmondi, Dhaka',
        contact: '+880-2-9669480',
        isPartner: true,
      },
      {
        name: 'BIRDEM General Hospital',
        address: '122 Kazi Nazrul Islam Avenue, Dhaka',
        contact: '+880-2-9661551',
        isPartner: true,
      },
      {
        name: 'National Institute of Cardiovascular Diseases (NICVD)',
        address: 'Sher-e-Bangla Nagar, Dhaka',
        contact: '+880-2-9122560',
        isPartner: true,
      },
      {
        name: 'National Institute of Neurosciences & Hospital',
        address: 'Sher-e-Bangla Nagar, Dhaka',
        contact: '+880-2-9112345',
        isPartner: true,
      },
      {
        name: 'Shaheed Suhrawardy Medical College Hospital',
        address: 'Sher-e-Bangla Nagar, Dhaka',
        contact: '+880-2-9130800',
        isPartner: true,
      },
      {
        name: 'Mugda Medical College Hospital',
        address: 'Mugda, Dhaka',
        contact: '+880-2-7551234',
        isPartner: true,
      },
      {
        name: 'Kurmitola General Hospital',
        address: 'Kurmitola, Dhaka',
        contact: '+880-2-8901234',
        isPartner: true,
      },
    ];

    for (const h of hospitals) {
      const hospital = queryRunner.manager.create(Hospital, {
        name: h.name,
        address: h.address,
        contactNumber: h.contact,
        isPartner: h.isPartner,
        isActive: true,
      });
      await queryRunner.manager.save(hospital);
    }
    console.log(`✅ ${hospitals.length} hospitals seeded`);

    await queryRunner.commitTransaction();

    console.log('\n========================================');
    console.log('🌱 SEED COMPLETE');
    console.log('========================================');
    console.log('\n📋 Login Credentials:\n');
    console.log('┌──────────────┬──────────────────┬─────────────────┐');
    console.log('│ Role         │ Staff ID         │ Password        │');
    console.log('├──────────────┼──────────────────┼─────────────────┤');
    console.log('│ Super Admin  │ ATB-26-SA-1      │ Admin@ATB2026   │');
    console.log('│ Admin        │ ATB-26-AD-1       │ Admin2@ATB2026  │');
    console.log('│ Owner        │ ATB-26-OW-1      │ Owner@ATB2026   │');
    console.log('│ Agent        │ ATB-26-AG-1      │ Agent@ATB2026   │');
    console.log('├──────────────┼──────────────────┼─────────────────┤');
    console.log('│ Member       │ ATB-26-ME-01        │ No password     │');
    console.log('└──────────────┴──────────────────┴─────────────────┘');
    console.log('\n⚠️  CHANGE ALL PASSWORDS IN PRODUCTION!');
    console.log('========================================\n');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Seed failed:', errorMessage);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(errorMessage);
    process.exit(1);
  });
