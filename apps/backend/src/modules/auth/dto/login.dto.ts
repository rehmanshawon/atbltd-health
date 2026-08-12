import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  mobileNumber: string;

  @IsString()
  @MinLength(4)
  password: string;
}
