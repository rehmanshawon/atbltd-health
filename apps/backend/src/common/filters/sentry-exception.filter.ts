import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      if (exception.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
        Sentry.captureException(exception);
      }
    } else {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
