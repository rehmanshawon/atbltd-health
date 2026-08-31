import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ClaimStatus } from '../../common/enums/claim-status.enum';

export class SubmitClaimDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  surgeryType: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  hospitalName: string;

  @IsDateString()
  admissionDate: string;

  @IsOptional()
  @IsDateString()
  operationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  doctorName?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  claimedAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateClaimStatusDto {
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
