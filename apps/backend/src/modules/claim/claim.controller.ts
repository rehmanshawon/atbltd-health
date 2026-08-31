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
import { ClaimDocumentService } from './claim-document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClaimStatus } from '../../common/enums/claim-status.enum';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { SubmitClaimDto, UpdateClaimStatusDto } from './claim.dto';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly claimDocumentService: ClaimDocumentService,
  ) {}

  /**
   * POST /api/claims — Member submits a claim
   */
  @Post()
  async submitClaim(@CurrentUser() user: JwtPayload, @Body() body: SubmitClaimDto) {
    return this.claimService.submitClaim(user.sub, body);
  }

  /**
   * GET /api/claims/stats — Admin: claim statistics
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllClaims(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
    @Query('status') status?: ClaimStatus,
    @Query('memberId') memberId?: string,
  ) {
    return this.claimService.getAllClaims({
      status,
      memberId,
      page,
      limit,
      reviewerRole: user.role,
    });
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateClaimStatusDto,
  ) {
    return this.claimService.updateClaimStatus(id, body.status, user.sub, user.role, body);
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
    return this.claimDocumentService.uploadDocumentsWithTypes(id, user.sub, body.documents);
  }

  /**
   * GET /api/claims/:id/documents — Get claim documents
   */
  @Get(':id/documents')
  async getClaimDocuments(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.claimDocumentService.getClaimDocuments(id, user.sub, user.role);
  }
}
