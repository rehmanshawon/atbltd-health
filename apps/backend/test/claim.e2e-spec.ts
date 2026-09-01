import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';
import { Membership } from '../src/entities/membership.entity';
import { UserRole } from '../src/common/enums/user-role.enum';

// Point at the disposable test database started by docker-compose.test.yml
// (see docker-compose.test.yml for the matching postgres credentials/port).
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5433';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'atbtest';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'atbtest';
process.env.DB_DATABASE = process.env.DB_DATABASE || 'atbltd_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret';

describe('Claim submission + maker-checker payment verification (e2e)', () => {
  let app: INestApplication;
  let userRepository: import('typeorm').Repository<User>;
  let membershipRepository: import('typeorm').Repository<Membership>;

  const mobileNumber = `017${Date.now().toString().slice(-8)}`;
  const runId = Date.now().toString().slice(-6);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    membershipRepository = moduleFixture.get(getRepositoryToken(Membership));
  });

  afterAll(async () => {
    await app.close();
  });

  async function seedStaff(role: UserRole, memberId: string) {
    const password = await bcrypt.hash('Password123!', 10);
    await userRepository.save(
      userRepository.create({
        memberId,
        fullName: `${role} Test User`,
        mobileNumber: `019${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 9)}`,
        password,
        role,
        isActive: true,
        isKycVerified: true,
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: memberId, password: 'Password123!' })
      .expect(200);

    return res.body.accessToken as string;
  }

  it('runs the full member registration -> maker-checker payment verification -> claim submission flow', async () => {
    // 1. Member registers (creates a PENDING payment + inactive membership)
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'Integration Test Member',
        mobileNumber,
        paymentMethod: 'bkash',
        senderAccount: mobileNumber,
      })
      .expect(201);

    expect(registerRes.body.success).toBe(true);
    const memberId: string = registerRes.body.memberId;

    // 2. Seed an Admin (Maker) and Super Admin (Checker) directly in the DB
    const adminToken = await seedStaff(UserRole.ADMIN, `ATB-E2E-ADMIN-${runId}`);
    const saToken = await seedStaff(UserRole.SUPER_ADMIN, `ATB-E2E-SA-${runId}`);

    // 3. Admin (Maker) sees the fresh pending payment and reviews it
    const pendingAsAdmin = await request(app.getHttpServer())
      .get('/admin/payments/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const payment = pendingAsAdmin.body.find(
      (p: { user?: { memberId: string } }) => p.user?.memberId === memberId,
    );
    expect(payment).toBeDefined();

    const makerRes = await request(app.getHttpServer())
      .post(`/admin/payments/${payment.id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(makerRes.body.requiresFinalApproval).toBe(true);

    // 4. Super Admin (Checker) authorizes the same payment, activating the membership
    const checkerRes = await request(app.getHttpServer())
      .post(`/admin/payments/${payment.id}/verify`)
      .set('Authorization', `Bearer ${saToken}`)
      .expect(201);

    expect(checkerRes.body.success).toBe(true);
    expect(checkerRes.body.message).toMatch(/authorized/i);

    // 5. A second verification attempt must be rejected (payment is no longer PENDING)
    await request(app.getHttpServer())
      .post(`/admin/payments/${payment.id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);

    // 6. Bypass the 1-month benefit waiting period for this test membership
    const membership = await membershipRepository.findOne({ where: { userId: payment.userId } });
    expect(membership).not.toBeNull();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    membership!.membershipStartDate = twoMonthsAgo;
    await membershipRepository.save(membership!);

    // 7. Member logs in with just their Member ID and submits a claim
    const memberLoginRes = await request(app.getHttpServer())
      .post('/auth/member-login')
      .send({ memberId })
      .expect(200);
    const memberToken: string = memberLoginRes.body.accessToken;

    const submitClaimRes = await request(app.getHttpServer())
      .post('/claims')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        surgeryType: 'Cardiac Surgery',
        hospitalName: 'ATB Partner Hospital',
        admissionDate: new Date().toISOString(),
        claimedAmount: 8000,
      })
      .expect(201);

    const claimId: string = submitClaimRes.body.id;
    expect(submitClaimRes.body.status).toBe('submitted');

    // 8. The member sees their own claim
    const myClaimsRes = await request(app.getHttpServer())
      .get('/claims/mine')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(myClaimsRes.body.some((c: { id: string }) => c.id === claimId)).toBe(true);

    // 9. Admin moves the claim to review, then Super Admin approves it
    // (mirrors the maker-checker transitions enforced by validateStatusTransition)
    await request(app.getHttpServer())
      .put(`/claims/${claimId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'under_review' })
      .expect(200);

    const approveRes = await request(app.getHttpServer())
      .put(`/claims/${claimId}/status`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ status: 'approved', approvedAmount: 7500 })
      .expect(200);
    expect(approveRes.body.status).toBe('approved');
    expect(Number(approveRes.body.approvedAmount)).toBe(7500);
  });

  it('rejects a claim submission when no active membership exists', async () => {
    const otherMobile = `018${Date.now().toString().slice(-8)}`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'No Membership Member',
        mobileNumber: otherMobile,
        paymentMethod: 'nagad',
        senderAccount: otherMobile,
      })
      .expect(201);

    // Member is inactive until payment is verified, so member-login must fail
    await request(app.getHttpServer())
      .post('/auth/member-login')
      .send({ memberId: registerRes.body.memberId })
      .expect(401);
  });
});
