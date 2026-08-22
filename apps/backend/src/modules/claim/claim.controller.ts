import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import 'multer';
import { ClaimService } from './claim.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  /**
   * POST /api/claims — Member submits a claim
   */
  @Post()
  async submitClaim(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      surgeryType: string;
      hospitalName: string;
      admissionDate: string;
      operationDate?: string;
      doctorName?: string;
      claimedAmount: number;
      notes?: string;
    },
  ) {
    return this.claimService.submitClaim(user.sub, body);
  }

  /**
   * POST /api/claims/:id/documents — Upload documents to a claim
   */
  @Post(':id/documents')
  @UseInterceptors(FilesInterceptor('documents', 10))
  async uploadDocuments(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    // In production, upload to S3/Cloud Storage and get URLs
    const fileUrls = files.map(
      (f) => `/uploads/claims/${id}/${f.originalname}`,
    );
    return this.claimService.uploadDocuments(id, user.sub, fileUrls);
  }

  /**
   * GET /api/claims/stats — Admin: claim statistics
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async getStats() {
    return this.claimService.getClaimStats();
  }

  /**
   * GET /api/claims/mine — Member: own claims
   */
  @Get('mine')
  async getMyClaims(@CurrentUser() user: JwtPayload) {
    return this.claimService.getMemberClaims(user.sub);
  }

  /**
   * GET /api/claims — Admin: all claims with filters
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllClaims(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
    @Query('status') status?: ClaimStatus,
    @Query('memberId') memberId?: string,
  ) {
    return this.claimService.getAllClaims({ status, memberId, page, limit });
  }

  /**
   * GET /api/claims/:id — Get single claim
   */
  @Get(':id')
  async getClaim(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.claimService.getClaimById(id, user.sub, user.role);
  }

  /**
   * PUT /api/claims/:id/status — Admin: update claim status
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      status: ClaimStatus;
      rejectionReason?: string;
      approvedAmount?: number;
      notes?: string;
    },
  ) {
    return this.claimService.updateClaimStatus(
      id,
      body.status,
      user.sub,
      user.role,
      body,
    );
  }

  /**
   * POST /api/claims/:id/documents/upload — Upload documents with types
   */
  @Post(':id/documents/upload')
  async uploadClaimDocuments(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      documents: Array<{
        documentType: string;
        fileName: string;
        fileUrl: string;
        notes?: string;
      }>;
    },
  ) {
    return this.claimService.uploadDocumentsWithTypes(
      id,
      user.sub,
      body.documents,
    );
  }

  /**
   * GET /api/claims/:id/documents — Get claim documents
   */
  @Get(':id/documents')
  async getClaimDocuments(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.claimService.getClaimDocuments(id, user.sub, user.role);
  }
}
