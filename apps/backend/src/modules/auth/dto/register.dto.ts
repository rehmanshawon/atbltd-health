import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nid?: string;

  @IsString()
  @MaxLength(15)
  mobileNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  currentAddress?: string;

  @IsOptional()
  @IsString()
  referralId?: string;

  @IsString()
  paymentMethod: string; // bkash, nagad, rocket

  @IsString()
  senderAccount: string; // REQUIRED - the bKash number that sent money

  // transactionId removed - no longer needed
}
