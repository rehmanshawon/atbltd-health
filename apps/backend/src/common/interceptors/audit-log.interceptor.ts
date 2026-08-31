import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  // Actions that should be logged
  private readonly auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Routes that should NOT be logged (auth endpoints are logged inside AuthService)
  private readonly excludedRoutes = [
    '/api/auth/login',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
  ];

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Skip non-auditable methods and excluded routes
    if (!this.auditableMethods.includes(method) || this.excludedRoutes.includes(url)) {
      return next.handle();
    }

    const user = (request as any).user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          // Log successful mutations
          this.createAuditLog(request, user, responseBody, 'SUCCESS', startTime);
        },
        error: (error) => {
          // Log failed attempts (potential security issues)
          this.createAuditLog(request, user, null, 'FAILED', startTime, error.message);
        },
      }),
    );
  }

  private async createAuditLog(
    request: Request,
    user: any,
    responseBody: any,
    status: string,
    startTime: number,
    errorMessage?: string,
  ) {
    try {
      const action = this.determineAction(request.method, request.url);

      await this.auditLogRepository.save({
        action,
        entity: this.extractEntityFromUrl(request.url),
        entityId: responseBody?.id || responseBody?.memberId || this.extractIdFromUrl(request.url),
        performedById: user?.sub || 'system',
        oldValue: null, // Could capture from request if needed
        newValue: {
          method: request.method,
          url: request.url,
          body: this.sanitizeBody(request.body),
          status,
          responseTimeMs: Date.now() - startTime,
          error: errorMessage,
        },
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] || 'unknown',
        requiresReview: status === 'FAILED',
      });
    } catch (error) {
      // Don't let audit log failures break the API
      console.error('Failed to create audit log:', error.message);
    }
  }

  private determineAction(method: string, url: string): string {
    const entity = this.extractEntityFromUrl(url).toUpperCase();

    switch (method) {
      case 'POST':
        return `${entity}_CREATED`;
      case 'PUT':
      case 'PATCH':
        return `${entity}_UPDATED`;
      case 'DELETE':
        return `${entity}_DELETED`;
      default:
        return `${entity}_MODIFIED`;
    }
  }

  private extractEntityFromUrl(url: string): string {
    // Extract entity name from URL: /api/users/123 → users
    const parts = url.split('/').filter(Boolean);
    // Skip 'api' prefix, return the next segment
    return parts[1] || 'unknown';
  }

  private extractIdFromUrl(url: string): string | null {
    // Extract UUID from URL if present
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = url.match(uuidPattern);
    return match ? match[0] : null;
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;

    // Remove sensitive fields before logging
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.token;
    delete sanitized.accessToken;
    delete sanitized.nid; // Don't log full NID

    return sanitized;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (
        (typeof forwarded === 'string' ? forwarded : forwarded[0])?.split(',')[0].trim() ||
        'unknown'
      );
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
