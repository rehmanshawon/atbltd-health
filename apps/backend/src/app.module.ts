import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MembershipModule } from './modules/membership/membership.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ClaimModule } from './modules/claim/claim.module';
import { SurgeryModule } from './modules/surgery/surgery.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { CommissionModule } from './modules/commission/commission.module';
import { AgentModule } from './modules/agent/agent.module';
@Module({
  imports: [
    CoreModule,
    AuthModule,
    UsersModule,
    MembershipModule,
    AdminModule,
    ClaimModule,
    SurgeryModule,
    HospitalModule,
    CommissionModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
