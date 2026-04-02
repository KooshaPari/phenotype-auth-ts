/**
 * phenotype-auth-ts
 *
 * TypeScript OAuth2/OIDC authentication patterns.
 *
 * xDD Methodologies:
 * - TDD: Test-driven with Vitest
 * - BDD: Scenario-based tests
 * - CDD: Contract tests for adapters
 */

export * from './domain/token';
export * from './domain/claims';
export * from './domain/errors';
export * from './ports';
export { MemoryTokenStore, asToken } from './adapters/memory-token-store';
export { JoseJwtVerifier, PlaceholderJwtVerifier, type JwtVerifierConfig } from './adapters/jwt-provider';
export { JwtTokenProvider, type JwtTokenProviderConfig } from './adapters/jwt-token-provider';
export { createAuthMiddleware, requireScope, type ExpressAuthMiddlewareConfig } from './adapters/express-middleware';
export { fastifyAuthPlugin, requireScope as requireScopeFastify, type FastifyAuthPluginOptions } from './adapters/fastify-middleware';
