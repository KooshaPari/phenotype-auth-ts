/**
 * Fastify plugin for bearer token authentication.
 *
 * Traces to: FR-MW-001, FR-MW-002, FR-MW-003
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { TokenVerifier } from '../ports';
import type { JwtClaims } from '../domain/claims';
import { AuthError } from '../domain/errors';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtClaims;
  }
}

export interface FastifyAuthPluginOptions {
  /** Token verifier instance */
  verifier: TokenVerifier;
  /** Required claims for validation */
  requiredClaims?: string[];
  /** Expected issuer */
  expectedIssuer?: string;
  /** Expected audience */
  expectedAudience?: string | string[];
}

/**
 * Extract bearer token from Authorization header.
 */
function extractBearerToken(req: FastifyRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Fastify plugin for bearer token authentication.
 *
 * Traces to: FR-MW-001, FR-MW-002, FR-MW-003
 *
 * @example
 * ```typescript
 * app.register(authPlugin, { verifier: jwtVerifier });
 * ```
 */
const authPlugin: FastifyPluginAsync<FastifyAuthPluginOptions> = async (
  fastify: FastifyInstance,
  options: FastifyAuthPluginOptions
) => {
  fastify.decorateRequest('user', undefined);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractBearerToken(request);

      if (!token) {
        reply.status(401).send({
          error: 'unauthorized',
          message: 'Missing or invalid Authorization header',
        });
        return;
      }

      // Verify the token
      const claims = await options.verifier.verify(token);

      // Validate claims if options provided
      if (options.requiredClaims || options.expectedIssuer || options.expectedAudience) {
        await options.verifier.validateClaims?.(claims, {
          requiredClaims: options.requiredClaims,
          expectedIssuer: options.expectedIssuer,
          expectedAudience: options.expectedAudience,
        });
      }

      // Attach claims to request (FR-MW-002)
      request.user = claims;
    } catch (error) {
      // Default error response (FR-MW-003)
      if (error instanceof AuthError) {
        reply.status(error.statusCode).send({
          error: error.code.toLowerCase(),
          message: error.message,
        });
        return;
      }

      reply.status(401).send({
        error: 'unauthorized',
        message: 'Token verification failed',
      });
    }
  });
};

export const fastifyAuthPlugin = fp(authPlugin, {
  name: 'fastify-auth-plugin',
});

/**
 * Fastify hook for scope-based authorization.
 *
 * @example
 * ```typescript
 * app.get('/admin', { preHandler: requireScope('admin:read') }, handler);
 * ```
 */
export function requireScope(...requiredScopes: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userScopes = (req.user?.scope as string)?.split(' ') || [];

    const hasScope = requiredScopes.every(scope => userScopes.includes(scope));

    if (!hasScope) {
      reply.status(403).send({
        error: 'insufficient_scope',
        message: `Required scope(s): ${requiredScopes.join(', ')}`,
      });
      return;
    }
  };
}
