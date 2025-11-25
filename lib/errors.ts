/**
 * Standardized Error Handling
 *
 * Provides consistent error handling across the application with proper
 * logging, user-friendly messages, and appropriate HTTP status codes.
 */

import { NextResponse } from 'next/server';

/**
 * Custom application error with user-friendly messaging
 */
export class AppError extends Error {
  constructor(
    message: string,
    public userMessage: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error types for common scenarios
 */
export const ErrorTypes = {
  VALIDATION: (message: string, details?: unknown) =>
    new AppError(message, 'Invalid request data', 400, details),

  NOT_FOUND: (resource: string) =>
    new AppError(`${resource} not found`, `${resource} not found`, 404),

  UNAUTHORIZED: () =>
    new AppError('Unauthorized access', 'You must be logged in', 401),

  FORBIDDEN: (message?: string) =>
    new AppError(
      message || 'Forbidden',
      'You do not have permission to perform this action',
      403
    ),

  AI_GENERATION_FAILED: (details?: string) =>
    new AppError(
      `AI generation failed: ${details}`,
      'Failed to generate content. Please try again.',
      500,
      details
    ),

  PARSING_FAILED: (details?: string) =>
    new AppError(
      `Parsing failed: ${details}`,
      'Failed to process response',
      500,
      details
    ),
} as const;

/**
 * Handles errors in API routes with consistent logging and response format
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known AppError instances
  if (error instanceof AppError) {
    console.error(`[${error.statusCode}] ${error.message}`, error.details);

    return NextResponse.json(
      {
        error: error.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.details,
          message: error.message,
        }),
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    console.error('Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && {
          message: error.message,
          stack: error.stack,
        }),
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  console.error('Unknown error type:', error);

  return NextResponse.json(
    {
      error: 'Something went wrong',
      ...(process.env.NODE_ENV === 'development' && {
        details: error,
      }),
    },
    { status: 500 }
  );
}

/**
 * Client-side error handler for displaying user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'error' in error) {
    return String(error.error);
  }

  return 'Something went wrong';
}
