import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788476347463 implements MigrationInterface {
  name = 'InitialSchema1788476347463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "membershipFee" numeric(10,2) NOT NULL DEFAULT '1000', "isPaymentVerified" boolean NOT NULL DEFAULT false, "paymentMethod" character varying, "transactionId" character varying, "paymentVerifiedBy" character varying, "paymentVerifiedAt" TIMESTAMP, "membershipStartDate" date, "membershipEndDate" date, "isActive" boolean NOT NULL DEFAULT false, "remainingBenefit" numeric(10,2) NOT NULL DEFAULT '12000', "renewalCount" integer NOT NULL DEFAULT '0', "renewalFee" numeric(10,2) NOT NULL DEFAULT '850', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_187d573e43b2c2aa3960df20b7" UNIQUE ("userId"), CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "performedById" uuid, "action" character varying NOT NULL, "entity" character varying NOT NULL, "entityId" character varying, "oldValue" jsonb, "newValue" jsonb, "ipAddress" character varying, "userAgent" character varying, "requiresReview" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin', 'owner', 'agent', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "memberId" character varying NOT NULL, "fullName" character varying NOT NULL, "fatherName" character varying, "motherName" character varying, "dateOfBirth" date, "nid" character varying, "mobileNumber" character varying NOT NULL, "email" character varying, "permanentAddress" character varying, "currentAddress" character varying, "emergencyContact" character varying, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'member', "isKycVerified" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT false, "referralId" character varying, "qrCode" character varying, "isTwoFactorEnabled" boolean NOT NULL DEFAULT false, "lastLoginAt" TIMESTAMP, "lastLoginIp" character varying, "deviceInfo" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bb2a621ce92bc6b86177c331fc8" UNIQUE ("memberId"), CONSTRAINT "UQ_b4cb829390106ed6a21bb04969e" UNIQUE ("nid"), CONSTRAINT "UQ_61dc14c8c49c187f5d08047c985" UNIQUE ("mobileNumber"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "surgeries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nameEn" character varying NOT NULL, "nameBn" character varying NOT NULL, "category" character varying, "isCovered" boolean NOT NULL DEFAULT true, "waitingPeriodDays" integer, "maxAssistance" integer, "requiredDocuments" character varying, "sortOrder" integer NOT NULL DEFAULT '1', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b308d8aa20274bbbbc3f33489d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymenttype_enum" AS ENUM('membership_fee', 'renewal', 'claim_disbursement', 'commission')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'verified', 'rejected', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "paymentType" "public"."payments_paymenttype_enum" NOT NULL DEFAULT 'membership_fee', "amount" numeric(10,2) NOT NULL, "method" character varying NOT NULL, "transactionId" character varying, "senderAccount" character varying, "recipientAccount" character varying NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "verifiedBy" character varying, "verifiedAt" TIMESTAMP, "rejectionReason" character varying, "screenshotUrl" character varying, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('member_registered', 'payment_verified', 'claim_submitted', 'claim_approved', 'claim_rejected', 'claim_status_updated', 'commission_earned', 'commission_paid', 'hospital_assigned', 'system_alert')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recipientId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'system_alert', "title" character varying NOT NULL, "message" text, "isRead" boolean NOT NULL DEFAULT false, "entityId" character varying, "linkUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "hospitals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying, "contactNumber" character varying, "email" character varying, "contactPerson" character varying, "isPartner" boolean NOT NULL DEFAULT false, "mouDocument" character varying, "loginId" character varying, "password" character varying, "isActive" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_02738c80d71453bc3e369a01766" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."agents_approvalstatus_enum" AS ENUM('pending', 'approved_by_admin', 'approved_by_sa', 'rejected', 'active', 'deactivation_pending', 'deactivation_approved_by_admin', 'deactivated')`,
    );
    await queryRunner.query(
      `CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "agentCode" character varying NOT NULL, "commissionRate" numeric(5,2) NOT NULL DEFAULT '10', "totalCommissionEarned" numeric(10,2) NOT NULL DEFAULT '0', "totalCommissionPaid" numeric(10,2) NOT NULL DEFAULT '0', "totalMembersRegistered" integer NOT NULL DEFAULT '0', "activeMembers" integer NOT NULL DEFAULT '0', "parentAgentId" uuid, "isActive" boolean NOT NULL DEFAULT true, "approvalStatus" "public"."agents_approvalstatus_enum" NOT NULL DEFAULT 'active', "createdBy" character varying, "createdByName" character varying, "createdByRole" character varying, "plainPassword" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe6088b21071f046d45f72b728d" UNIQUE ("agentCode"), CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."commissions_commissiontype_enum" AS ENUM('member_registration', 'renewal', 'override')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."commissions_status_enum" AS ENUM('pending', 'approved', 'declined', 'paid', 'reversed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "commissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "agentId" uuid NOT NULL, "agentCode" character varying NOT NULL, "memberId" uuid, "memberCode" character varying, "commissionType" "public"."commissions_commissiontype_enum" NOT NULL DEFAULT 'member_registration', "registrationAmount" numeric(10,2) NOT NULL, "commissionRate" numeric(5,2) NOT NULL, "commissionAmount" numeric(10,2) NOT NULL, "status" "public"."commissions_status_enum" NOT NULL DEFAULT 'pending', "approvedBy" character varying, "checkerApprovedBy" character varying, "approvedAt" TIMESTAMP, "paidAt" TIMESTAMP, "reversedAt" TIMESTAMP, "reversalReason" character varying, "paymentTransactionId" character varying, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2701379966e2e670bb5ff0ae78e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."claims_status_enum" AS ENUM('submitted', 'under_review', 'document_required', 'hospital_verification', 'approved', 'rejected', 'payment_processed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "memberId" uuid NOT NULL, "surgeryType" character varying NOT NULL, "hospitalName" character varying NOT NULL, "admissionDate" date NOT NULL, "operationDate" date, "doctorName" character varying, "doctorInfo" character varying, "documents" text, "claimedAmount" numeric(10,2) NOT NULL, "approvedAmount" numeric(10,2), "status" "public"."claims_status_enum" NOT NULL DEFAULT 'submitted', "reviewedBy" character varying, "reviewedAt" TIMESTAMP, "hospitalVerifiedBy" character varying, "hospitalVerifiedAt" TIMESTAMP, "approvedBy" character varying, "checkerApprovedBy" character varying, "rejectionReason" character varying, "notes" character varying, "isDisbursed" boolean NOT NULL DEFAULT false, "disbursedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_96c91970c0dcb2f69fdccd0a698" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "claim_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "claimId" uuid NOT NULL, "documentType" character varying NOT NULL, "fileUrl" character varying NOT NULL, "fileName" character varying NOT NULL, "notes" character varying, "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_926ac9a44ec173769f00b65b841" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" ADD CONSTRAINT "FK_187d573e43b2c2aa3960df20b78" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_371007aca0b12c07d6d2dbdb83a" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ADD CONSTRAINT "FK_f535e5b2c0f0dc7b7fc656ebc91" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ADD CONSTRAINT "FK_bf6db0ecc85a85e6db8fa05edf6" FOREIGN KEY ("parentAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" ADD CONSTRAINT "FK_7e4e78904cef625e0212dc9138a" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" ADD CONSTRAINT "FK_85f1fca92f85cb27241f5573a0c" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" ADD CONSTRAINT "FK_8ec93b65730b2fbcf191d0be4e9" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "claim_documents" ADD CONSTRAINT "FK_718164d7fb5ba51d93bb07d7168" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "claim_documents" DROP CONSTRAINT "FK_718164d7fb5ba51d93bb07d7168"`,
    );
    await queryRunner.query(
      `ALTER TABLE "claims" DROP CONSTRAINT "FK_8ec93b65730b2fbcf191d0be4e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" DROP CONSTRAINT "FK_85f1fca92f85cb27241f5573a0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commissions" DROP CONSTRAINT "FK_7e4e78904cef625e0212dc9138a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" DROP CONSTRAINT "FK_bf6db0ecc85a85e6db8fa05edf6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" DROP CONSTRAINT "FK_f535e5b2c0f0dc7b7fc656ebc91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_371007aca0b12c07d6d2dbdb83a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memberships" DROP CONSTRAINT "FK_187d573e43b2c2aa3960df20b78"`,
    );
    await queryRunner.query(`DROP TABLE "claim_documents"`);
    await queryRunner.query(`DROP TABLE "claims"`);
    await queryRunner.query(`DROP TYPE "public"."claims_status_enum"`);
    await queryRunner.query(`DROP TABLE "commissions"`);
    await queryRunner.query(`DROP TYPE "public"."commissions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."commissions_commissiontype_enum"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`DROP TYPE "public"."agents_approvalstatus_enum"`);
    await queryRunner.query(`DROP TABLE "hospitals"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
    await queryRunner.query(`DROP TABLE "surgeries"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
  }
}
