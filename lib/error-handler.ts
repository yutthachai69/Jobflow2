/**
 * Error Handler Utilities
 * 
 * Centralized error handling and tracking
 */

import { logger, createLogContext, LogContext } from './logger'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  context?: LogContext
}

/**
 * Create a standardized application error
 */
export function createAppError(
  message: string,
  statusCode: number = 500,
  code?: string,
  context?: LogContext
): AppError {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.code = code
  error.context = context
  return error
}

/**
 * Handle and log error
 */
export function handleError(
  error: unknown,
  context?: LogContext,
  additionalInfo?: Record<string, any>
): AppError {
  let appError: AppError

  if (error instanceof Error) {
    appError = error as AppError
  } else {
    appError = createAppError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      context
    )
  }

  // Merge context
  const fullContext: LogContext = {
    ...context,
    ...appError.context,
    ...additionalInfo,
  }

  // Log error
  logger.logError(appError, fullContext)

  return appError
}

/**
 * Handle API route error
 */
export function handleApiError(
  error: unknown,
  request: Request,
  user?: { id?: string; username?: string; role?: string } | null
) {
  const context = createLogContext(request, user)
  const appError = handleError(error, context)

  return {
    error: appError.message,
    code: appError.code || 'INTERNAL_ERROR',
    statusCode: appError.statusCode || 500,
    // Only include stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: appError.stack }),
  }
}

/**
 * Handle server action error
 */
export async function handleServerActionError(
  error: unknown,
  user?: { id?: string; username?: string; role?: string } | null,
  additionalContext?: Record<string, any>
) {
  const context: LogContext = {
    ...additionalContext,
  }

  if (user) {
    context.userId = user.id
    context.username = user.username
    context.role = user.role
  }

  const appError = handleError(error, context)

  // Log error
  logger.error('Server action error', context, appError)

  // Return user-friendly error message
  return appError.message
}

