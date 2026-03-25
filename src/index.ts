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
export * from './ports/token-store';
export * from './ports/auth-provider';
export * from './adapters/memory-token-store';
export * from './adapters/jwt-provider';
