import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  mobileNumber: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
