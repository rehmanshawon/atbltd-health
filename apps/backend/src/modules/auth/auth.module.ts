import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../../entities/user.entity';
import { Membership } from '../../entities/membership.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Agent } from '../../entities/agent.entity';
import { NotificationModule } from '../notification/notification.module';
import { SmsModule } from '../sms/sms.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership, Payment, AuditLog, Agent]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
      signOptions: {
        expiresIn: '24h', // Token expires in 24 hours
      },
    }),
    NotificationModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
