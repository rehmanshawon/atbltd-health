import {
  IsString,
  IsOptional,
  IsMobilePhone,
  IsEmail,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fatherName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  motherName?: string;

  @IsOptional()
  @IsDateString()
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
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  referralId?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  paymentMethod: string; // bkash, nagad, rocket, bank

  @IsString()
  transactionId: string;

  @IsOptional()
  @IsString()
  senderAccount?: string; // Phone number that sent the payment
}
