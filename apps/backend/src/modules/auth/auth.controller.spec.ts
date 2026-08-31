import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let app: INestApplication;
  const authService = { register: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects malformed registration input before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullName: 'A',
        mobileNumber: '01712345678',
        email: 'not-an-email',
        paymentMethod: 'bkash',
        senderAccount: '01712345678',
        unexpectedField: 'reject me',
      })
      .expect(400);

    expect(authService.register).not.toHaveBeenCalled();
  });
});
