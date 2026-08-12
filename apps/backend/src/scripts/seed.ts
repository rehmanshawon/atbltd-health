import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
    const adminPassword = await bcrypt.hash('Admin@ATB2026', 12);

    const admin = queryRunner.manager.create(User, {
      memberId: 'ATB-2026-000000',
      fullName: 'System Administrator',
      mobileNumber: '01700000000',
      email: 'admin@atbltd.health',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isKycVerified: true,
      permanentAddress: 'ATB Headquarters, Uttara, Dhaka',
    });

    const savedAdmin = await queryRunner.manager.save(admin);
    console.log(`✅ Admin created: ${savedAdmin.memberId}`);

    // ============================================================
    // 2. Create an Owner
    // ============================================================
    const ownerPassword = await bcrypt.hash('Owner@ATB2026', 12);

    const owner = queryRunner.manager.create(User, {
      memberId: 'ATB-2026-000001',
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
      agentCode: 'AGT-2026-000001',
      commissionRate: 15.0, // 15% - direct acquisition rate per agenda
      isActive: true,
    });

    await queryRunner.manager.save(ownerAgent);
    console.log(`✅ Owner agent record created: ${ownerAgent.agentCode}`);

    // ============================================================
    // 3. Create a Sample Agent
    // ============================================================
    const agentPassword = await bcrypt.hash('Agent@ATB2026', 12);

    const agentUser = queryRunner.manager.create(User, {
      memberId: 'ATB-2026-000002',
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
      agentCode: 'AGT-2026-000002',
      commissionRate: 10.0, // 10% - standard agent rate per agenda
      parentAgentId: null, // Set via API when hierarchy is established
      isActive: true,
    });

    await queryRunner.manager.save(agent);
    console.log(`✅ Agent created: ${agent.agentCode}`);

    // ============================================================
    // 4. Create a Sample Member (fully activated)
    // ============================================================
    const memberPassword = await bcrypt.hash('Member@ATB2026', 12);

    const member = queryRunner.manager.create(User, {
      memberId: 'ATB-2026-000003',
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
      referralId: 'AGT-2026-000002', // Referred by the sample agent
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
      paymentVerifiedBy: savedAdmin.id,
      paymentVerifiedAt: new Date(),
      membershipStartDate: new Date(),
      membershipEndDate: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      ),
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
      recipientAccount: '01XXXXXXXXX', // ATB Official bKash
      status: PaymentStatus.VERIFIED,
      verifiedBy: savedAdmin.id,
      verifiedAt: new Date(),
    });

    await queryRunner.manager.save(payment);
    console.log(`✅ Payment recorded for ${savedMember.memberId}`);

    // Update agent's registration count
    agent.totalMembersRegistered += 1;
    agent.activeMembers += 1;
    await queryRunner.manager.save(agent);

    // ============================================================
    // 5. Seed Surgeries (Covered Diseases List)
    // ============================================================
    const surgeries = [
      {
        nameEn: 'High Fever / Dengue',
        nameBn: 'উচ্চ জ্বর / ডেঙ্গু',
        category: 'General Medicine',
      },
      { nameEn: 'Pneumonia', nameBn: 'নিউমোনিয়া', category: 'Respiratory' },
      { nameEn: 'Typhoid', nameBn: 'টাইফয়েড', category: 'General Medicine' },
      {
        nameEn: 'Severe Diarrhea / Cholera',
        nameBn: 'গুরুতর ডায়রিয়া / কলেরা',
        category: 'General Medicine',
      },
      { nameEn: 'Meningitis', nameBn: 'মেনিনজাইটিস', category: 'Neurology' },
      { nameEn: 'Tonsillitis', nameBn: 'টনসিলাইটিস', category: 'ENT' },
      {
        nameEn: 'Kidney Conditions & Kidney Stone',
        nameBn: 'কিডনি-সংক্রান্ত অবস্থা ও কিডনি স্টোন',
        category: 'Urology',
      },
      {
        nameEn: 'Cancer / Tumor Treatment',
        nameBn: 'ক্যান্সার / টিউমার চিকিৎসা',
        category: 'Oncology',
      },
      {
        nameEn: 'Asthma Attack',
        nameBn: 'অ্যাজমা অ্যাটাক',
        category: 'Respiratory',
      },
      { nameEn: 'Stroke', nameBn: 'স্ট্রোক', category: 'Neurology' },
      {
        nameEn: 'High Blood Pressure',
        nameBn: 'উচ্চ রক্তচাপ',
        category: 'Cardiology',
      },
      {
        nameEn: 'Accident / ICU Admission',
        nameBn: 'দুর্ঘটনা / ICU ভর্তি',
        category: 'Emergency',
      },
      { nameEn: 'Burn Injuries', nameBn: 'পোড়া রোগী', category: 'Emergency' },
      {
        nameEn: 'Snakebite / Poisoning',
        nameBn: 'সাপ/বিষাক্ত প্রাণী দংশন',
        category: 'Emergency',
      },
      {
        nameEn: 'Fissure & Fistula Surgery',
        nameBn: 'ফিসার ও ফিস্টুলা সার্জারি',
        category: 'General Surgery',
      },
      {
        nameEn: 'Orthopedic & Trauma',
        nameBn: 'অর্থোপেডিক ও ট্রমা',
        category: 'Orthopedic',
      },
      {
        nameEn: 'C-Section',
        nameBn: 'সিজারিয়ান সেকশন',
        category: 'Obstetrics',
      },
      {
        nameEn: 'Appendectomy',
        nameBn: 'অ্যাপেন্ডেকটমি',
        category: 'General Surgery',
      },
      {
        nameEn: 'Gallbladder Surgery (Cholecystectomy)',
        nameBn: 'গলব্লাডার সার্জারি',
        category: 'General Surgery',
      },
      {
        nameEn: 'Hernia Repair',
        nameBn: 'হার্নিয়া রিপেয়ার',
        category: 'General Surgery',
      },
      {
        nameEn: 'Hysterectomy',
        nameBn: 'হিস্টারেকটমি',
        category: 'Gynecology',
      },
      { nameEn: 'Myomectomy', nameBn: 'মায়োমেকটমি', category: 'Gynecology' },
      {
        nameEn: 'Kidney Stone Removal',
        nameBn: 'কিডনি স্টোন অপসারণ',
        category: 'Urology',
      },
      {
        nameEn: 'Prostate Surgery (TURP)',
        nameBn: 'প্রোস্টেট সার্জারি',
        category: 'Urology',
      },
      {
        nameEn: 'Hemorrhoid / Piles Surgery',
        nameBn: 'হেমোরয়েড / পাইলস সার্জারি',
        category: 'General Surgery',
      },
      {
        nameEn: 'Cataract Surgery (Phaco)',
        nameBn: 'ক্যাটারাক্ট সার্জারি',
        category: 'Ophthalmology',
      },
      { nameEn: 'Tonsillectomy', nameBn: 'টনসিলেক্টমি', category: 'ENT' },
      {
        nameEn: 'Septoplasty / Rhinoplasty',
        nameBn: 'সেপ্টোপ্লাস্টি / রাইনোপ্লাস্টি',
        category: 'ENT',
      },
      {
        nameEn: 'Tympanoplasty',
        nameBn: 'টাইমপ্যানোপ্লাস্টি',
        category: 'ENT',
      },
      {
        nameEn: 'Bone Fracture Fixation',
        nameBn: 'বোন ফ্র্যাকচার ফিক্সেশন',
        category: 'Orthopedic',
      },
      {
        nameEn: 'Knee Replacement',
        nameBn: 'হাঁটু রিপ্লেসমেন্ট',
        category: 'Orthopedic',
      },
      {
        nameEn: 'Hip Replacement',
        nameBn: 'হিপ রিপ্লেসমেন্ট',
        category: 'Orthopedic',
      },
      {
        nameEn: 'Brain Tumor Surgery (Craniotomy)',
        nameBn: 'ব্রেইন টিউমার সার্জারি',
        category: 'Neurosurgery',
      },
      {
        nameEn: 'Spinal Surgery (Laminectomy)',
        nameBn: 'স্পাইনাল সার্জারি',
        category: 'Neurosurgery',
      },
      {
        nameEn: 'CABG (Heart Bypass)',
        nameBn: 'করোনারি আর্টারি বাইপাস',
        category: 'Cardiac Surgery',
      },
      {
        nameEn: 'Angioplasty / Stenting',
        nameBn: 'অ্যাঞ্জিওপ্লাস্টি / স্টেন্টিং',
        category: 'Cardiology',
      },
      {
        nameEn: 'Pacemaker Implantation',
        nameBn: 'পেসমেকার ইমপ্ল্যান্টেশন',
        category: 'Cardiology',
      },
      {
        nameEn: 'Thyroid Surgery',
        nameBn: 'থাইরয়েড সার্জারি',
        category: 'Endocrine Surgery',
      },
      {
        nameEn: 'Gastrectomy / Intestinal Surgery',
        nameBn: 'গ্যাস্ট্রেকটমি / ইন্টেস্টাইনাল সার্জারি',
        category: 'General Surgery',
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
    // 6. Seed Hospitals
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
    console.log('┌──────────┬──────────────────┬─────────────────┐');
    console.log('│ Role     │ Mobile           │ Password        │');
    console.log('├──────────┼──────────────────┼─────────────────┤');
    console.log('│ Admin    │ 01700000000      │ Admin@ATB2026   │');
    console.log('│ Owner    │ 01711993597      │ Owner@ATB2026   │');
    console.log('│ Agent    │ 01710000001      │ Agent@ATB2026   │');
    console.log('│ Member   │ 01710000002      │ Member@ATB2026  │');
    console.log('└──────────┴──────────────────┴─────────────────┘');
    console.log('\n⚠️  CHANGE ALL PASSWORDS IN PRODUCTION!');
    console.log('========================================\n');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
