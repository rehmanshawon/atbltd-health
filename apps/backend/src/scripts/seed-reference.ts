import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Surgery } from '../entities/surgery.entity';
import { Hospital } from '../entities/hospital.entity';

async function bootstrap() {
  console.log('🌱 Seeding reference data (surgeries & hospitals)...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if already seeded
    const surgeryCount = await queryRunner.manager.count(Surgery);
    const hospitalCount = await queryRunner.manager.count(Hospital);

    if (surgeryCount > 0 && hospitalCount > 0) {
      console.log(
        `⚠️  Already have ${surgeryCount} surgeries and ${hospitalCount} hospitals.`,
      );
      console.log('   Delete them first if you want to re-seed:');
      console.log(
        '   psql -U rehman -d atbltd -c "DELETE FROM surgeries; DELETE FROM hospitals;"',
      );
      await app.close();
      return;
    }

    // Seed surgeries
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
      await queryRunner.manager.save(
        queryRunner.manager.create(Surgery, {
          nameEn: s.nameEn,
          nameBn: s.nameBn,
          category: s.category,
          isCovered: true,
          waitingPeriodDays: 30,
          maxAssistance: 12000,
          sortOrder: i + 1,
          isActive: true,
        }),
      );
    }
    console.log(`✅ ${surgeries.length} surgeries seeded`);

    // Seed hospitals
    const hospitals = [
      {
        name: 'Dhaka Medical College Hospital',
        address: 'Secretariat Road, Dhaka',
        phone: '+880-2-55165000',
        partner: true,
      },
      {
        name: 'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
        address: 'Shahbagh, Dhaka',
        phone: '+880-2-55165000',
        partner: true,
      },
      {
        name: 'Square Hospital',
        address: '18/F, Bir Uttam Qazi Nuruzzaman Sarak, Dhaka',
        phone: '+880-2-8144400',
        partner: true,
      },
      {
        name: 'United Hospital',
        address: 'Plot 15, Road 71, Gulshan, Dhaka',
        phone: '+880-2-8836000',
        partner: true,
      },
      {
        name: 'Apollo Hospitals Dhaka',
        address: 'Plot 81, Block E, Bashundhara, Dhaka',
        phone: '+880-2-55037242',
        partner: true,
      },
      {
        name: 'Evercare Hospital Dhaka',
        address: 'Plot 81, Block E, Bashundhara, Dhaka',
        phone: '+880-2-55037242',
        partner: true,
      },
      {
        name: 'Ibn Sina Hospital',
        address: 'House 48, Road 9/A, Dhanmondi, Dhaka',
        phone: '+880-2-8112345',
        partner: true,
      },
      {
        name: 'Labaid Specialized Hospital',
        address: 'House 06, Road 04, Dhanmondi, Dhaka',
        phone: '+880-2-9676356',
        partner: true,
      },
      {
        name: 'Popular Medical College Hospital',
        address: 'House 25, Road 2, Dhanmondi, Dhaka',
        phone: '+880-2-9669480',
        partner: true,
      },
      {
        name: 'BIRDEM General Hospital',
        address: '122 Kazi Nazrul Islam Avenue, Dhaka',
        phone: '+880-2-9661551',
        partner: true,
      },
      {
        name: 'NICVD',
        address: 'Sher-e-Bangla Nagar, Dhaka',
        phone: '+880-2-9122560',
        partner: true,
      },
      {
        name: 'National Institute of Neurosciences',
        address: 'Sher-e-Bangla Nagar, Dhaka',
        phone: '+880-2-9112345',
        partner: true,
      },
      {
        name: 'Shaheed Suhrawardy Medical College Hospital',
        address: 'Sher-e-Bangla Nagar, Dhaka',
        phone: '+880-2-9130800',
        partner: false,
      },
      {
        name: 'Mugda Medical College Hospital',
        address: 'Mugda, Dhaka',
        phone: '+880-2-7551234',
        partner: false,
      },
      {
        name: 'Kurmitola General Hospital',
        address: 'Kurmitola, Dhaka',
        phone: '+880-2-8901234',
        partner: false,
      },
    ];

    for (const h of hospitals) {
      await queryRunner.manager.save(
        queryRunner.manager.create(Hospital, {
          name: h.name,
          address: h.address,
          contactNumber: h.phone,
          isPartner: h.partner,
          isActive: true,
        }),
      );
    }
    console.log(`✅ ${hospitals.length} hospitals seeded`);

    await queryRunner.commitTransaction();
    console.log('\n✅ Reference data seeding complete!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Seed failed:', msg);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(msg);
    process.exit(1);
  });
