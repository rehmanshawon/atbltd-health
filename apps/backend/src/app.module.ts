import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MembershipModule } from './modules/membership/membership.module';
import { AdminModule } from './modules/admin/admin.module';
import { ClaimModule } from './modules/claim/claim.module';
import { CommissionModule } from './modules/commission/commission.module';
import { SurgeryModule } from './modules/surgery/surgery.module';
import { AgentModule } from './modules/agent/agent.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SmsModule } from './modules/sms/sms.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CustomLoggerModule } from './modules/logger/logger.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    CoreModule,
    CustomLoggerModule,
    AuthModule,
    UsersModule,
    MembershipModule,
    AdminModule,
    ClaimModule,
    CommissionModule,
    SurgeryModule,
    AgentModule,
    HospitalModule,
    NotificationModule,
    SmsModule,
    ReportModule,
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
