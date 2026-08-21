import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // Can be Staff ID (e.g., ATB-26-SA-1) OR mobile number

  @IsString()
  @MinLength(4)
  password: string;
}
