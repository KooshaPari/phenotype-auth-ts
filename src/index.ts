/**
 * Authentication and authorization domain for Phenotype.
 * @trace AUTH-001: OIDC Support
 * @trace AUTH-003: OAuth2 Provider
 * @trace AUTH-004: JWT Validation
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
export {
  OAuth2PkceFlow,
  createPkcePair,
  generateCodeVerifier,
  generateCodeChallenge,
  verifyPkce,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  type PkcePair,
  type AuthorizationUrlOptions,
  type TokenExchangeOptions,
  type TokenExchangeResponse,
} from './adapters/oauth2-pkce';
