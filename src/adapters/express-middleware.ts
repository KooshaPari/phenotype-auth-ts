/**
 * Express.js middleware for bearer token authentication.
 *
 * Traces to: FR-MW-001, FR-MW-002, FR-MW-003
 */

import type { Request, Response, NextFunction } from 'express';
import type { TokenVerifier } from '../ports';
import type { JwtClaims } from '../domain/claims';
import { AuthError } from '../domain/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtClaims;
    }
  }
}

export interface ExpressAuthMiddlewareConfig {
  /** Token verifier instance */
  verifier: TokenVerifier;
  /** Required claims for validation */
  requiredClaims?: string[];
  /** Expected issuer */
  expectedIssuer?: string;
  /** Expected audience */
  expectedAudience?: string | string[];
  /** Custom error handler */
  onError?: (error: AuthError, req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Extract bearer token from Authorization header.
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Create Express middleware for bearer token authentication.
 *
 * Traces to: FR-MW-001
 *
 * @example
 * ```typescript
 * app.use(createAuthMiddleware({ verifier: jwtVerifier }));
 * ```
 */
export function createAuthMiddleware(config: ExpressAuthMiddlewareConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req);

      if (!token) {
        res.status(401).json({
          error: 'unauthorized',
          message: 'Missing or invalid Authorization header',
        });
        return;
      }

      // Verify the token
      const claims = await config.verifier.verify(token);

      // Validate claims if options provided
      if (config.requiredClaims || config.expectedIssuer || config.expectedAudience) {
        await config.verifier.validateClaims?.(claims, {
          requiredClaims: config.requiredClaims,
          expectedIssuer: config.expectedIssuer,
          expectedAudience: config.expectedAudience,
        });
      }

      // Attach claims to request (FR-MW-002)
      req.user = claims;

      next();
    } catch (error) {
      // Use custom error handler if provided
      if (config.onError && error instanceof AuthError) {
        config.onError(error, req, res, next);
        return;
      }

      // Default error response (FR-MW-003)
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          error: error.code.toLowerCase(),
          message: error.message,
        });
        return;
      }

      res.status(401).json({
        error: 'unauthorized',
        message: 'Token verification failed',
      });
    }
  };
}

/**
 * Create Express middleware for scope-based authorization.
 *
 * Must be used after createAuthMiddleware.
 *
 * @example
 * ```typescript
 * app.get('/admin', requireScope('admin:read'), handler);
 * ```
 */
export function requireScope(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userScopes = (req.user?.scope as string)?.split(' ') || [];

    const hasScope = requiredScopes.every(scope => userScopes.includes(scope));

    if (!hasScope) {
      res.status(403).json({
        error: 'insufficient_scope',
        message: `Required scope(s): ${requiredScopes.join(', ')}`,
      });
      return;
    }

    next();
  };
}
