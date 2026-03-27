# phenotype-auth-ts — Product Requirements Document

## Product Vision

`@phenotype/auth-ts` is a zero-runtime-dependency TypeScript library that provides hexagonal-architecture OAuth2/OIDC authentication patterns — domain types, port interfaces, and swappable adapters — so TypeScript services across the Phenotype ecosystem share a consistent, testable auth model without coupling to any specific JWT library or token storage backend.

---

## Epics

### E1: Domain Model for OAuth2 / OIDC Token Lifecycle

**Goal**: Define strongly-typed domain models for all token-related data structures so every service in the ecosystem shares a canonical, interoperable representation.

**User Stories**:
- E1.1: As a service developer, I want a `Token` interface with `accessToken`, `tokenType`, `expiresAt`, and optional `refreshToken`/`scope` fields so I have a canonical representation of issued tokens.
  - AC: `Token` is exported from `src/domain/token.ts`.
  - AC: All fields are `readonly` preventing accidental mutation.
  - Source: `src/domain/token.ts:Token`
- E1.2: As a service developer, I want a `TokenRequest` interface covering all four OAuth2 grant types (`client_credentials`, `password`, `refresh_token`, `authorization_code`) so the same type covers all auth flows.
  - AC: `TokenRequest.grantType` is a discriminated union of the four grant type strings.
  - AC: Grant-specific fields (`code`, `redirectUri`, `username`, `password`) are optional so the interface covers all flows.
  - Source: `src/domain/token.ts:TokenRequest`
- E1.3: As a service developer, I want a `JwtClaims` interface with standard OIDC claims (`sub`, `iss`, `aud`, `exp`, `iat`) plus an index signature so I can pass arbitrary claim objects without casting.
  - AC: `JwtClaims` is exported from `src/domain/claims.ts`.
  - AC: All standard claim fields are optional to accommodate partial JWTs.
  - Source: `src/domain/claims.ts:JwtClaims`

---

### E2: Typed Error Hierarchy

**Goal**: Provide strongly-typed error classes for OAuth2 grant errors and authentication-layer errors so consumers can programmatically branch on error type without string parsing.

**User Stories**:
- E2.1: As a service developer, I want `TokenError` with RFC 6749 error codes so I can map IdP error responses to structured errors.
  - AC: Static factories: `TokenError.invalidRequest()`, `TokenError.invalidClient()`, `TokenError.invalidGrant()`, `TokenError.unauthorizedClient()`, `TokenError.unsupportedGrantType()`.
  - AC: Each factory sets `statusCode` to the correct HTTP status (400, 401, 403).
  - Source: `src/domain/token.ts:TokenError`
- E2.2: As a service developer, I want `AuthError` with auth-layer codes (`INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_SIGNATURE`, `MISSING_CLAIM`, `INVALID_CLAIM`, `INSUFFICIENT_SCOPE`, `PROVIDER_ERROR`) so application error handlers can distinguish token validation failures from network errors.
  - AC: `AuthErrors` namespace exported from `src/domain/errors.ts` contains factory functions for each code.
  - AC: `INSUFFICIENT_SCOPE` factory lists both required and actual scopes in the message.
  - Source: `src/domain/errors.ts:AuthErrors`

---

### E3: Port Interface Contracts (Hexagonal Outbound Ports)

**Goal**: Define three segregated port interfaces that decouple the application core from IdP, storage, and cryptography implementations.

**User Stories**:
- E3.1: As an architect, I want a `TokenProvider` port with `requestToken(req: TokenRequest): Promise<TokenResponse>` and optional `refreshToken(refreshToken: string): Promise<TokenResponse>` so application code calls a single interface regardless of IdP (Keycloak, Auth0, Cognito, etc.).
  - AC: `TokenProvider` is exported from `src/ports/index.ts`.
  - AC: `refreshToken` is optional in the interface to support IdPs that don't issue refresh tokens.
  - Source: `src/ports/index.ts:TokenProvider`
- E3.2: As a service developer, I want a `TokenStore` port with `save(key, token, ttlSeconds)`, `get(key)`, and `delete(key)` so token caching logic in the application core does not import Redis or any storage library.
  - AC: All methods are async (`Promise<void>` or `Promise<unknown | null>`).
  - AC: `get` returns `null` (not `undefined`) for missing or expired entries.
  - Source: `src/ports/index.ts:TokenStore`
- E3.3: As a service developer, I want a `TokenVerifier` port with `verify(token: string): Promise<JwtClaims>` and optional `validateClaims(claims, options)` so JWT validation is swappable without changing application logic.
  - AC: `ClaimsValidationOptions` supports `requiredClaims`, `expectedIssuer`, and `expectedAudience`.
  - AC: `validateClaims` returns `Promise<boolean>` and throws `AuthError` for validation failures.
  - Source: `src/ports/index.ts:TokenVerifier`, `ClaimsValidationOptions`

---

### E4: Reference Adapter Implementations

**Goal**: Ship concrete adapter implementations that work immediately for testing and local development, with clear documentation on how to replace them for production.

**User Stories**:
- E4.1: As a service developer, I want a `MemoryTokenStore` adapter that stores tokens in a `Map` with lazy TTL expiry so I can run integration tests without a Redis instance.
  - AC: `MemoryTokenStore` implements `TokenStore`.
  - AC: Expired entries are evicted on `get()` call without a background timer.
  - AC: `asToken(value: unknown): Token | null` helper exported for type-safe casting.
  - Source: `src/adapters/memory-token-store.ts`
- E4.2: As a developer writing tests, I want a `PlaceholderJwtVerifier` that throws `INVALID_TOKEN` on `verify()` and implements full `validateClaims()` logic so I can test claim validation without real JWTs.
  - AC: `PlaceholderJwtVerifier.verify()` always throws `AuthErrors.INVALID_TOKEN()` as a deliberate stub.
  - AC: `PlaceholderJwtVerifier.validateClaims()` validates `requiredClaims`, `expectedIssuer`, and `expectedAudience` with correct `AuthErrors`.
  - Source: `src/adapters/jwt-provider.ts:PlaceholderJwtVerifier`

---

### E5: Package Distribution and Build

**Goal**: Publish as an ESM package with TypeScript declarations so consumers get full type safety and tree-shaking in any modern bundler.

**User Stories**:
- E5.1: As a consumer, I want the package to ship as ESM (`type: module`) with `.d.ts` declarations so I get type checking and no CommonJS interop issues.
  - AC: `package.json` sets `"type": "module"`, `"main": "./dist/index.js"`, `"types": "./dist/index.d.ts"`.
  - AC: `tsc -p tsconfig.json` produces `dist/` with `.js` and `.d.ts` files.
  - Source: `package.json`
- E5.2: As a consumer, I want all public types re-exported from a single `src/index.ts` barrel so import paths are stable and predictable.
  - AC: `src/index.ts` is the single public export surface.
  - AC: Internal module paths (`src/domain/`, `src/ports/`, `src/adapters/`) are not referenced in consumer import statements.
  - Source: `src/index.ts`
- E5.3: As a maintainer, I want Vitest v4+ with TypeScript type-checking on every test run so type regressions are caught in CI.
  - AC: `npm test` runs `vitest run`.
  - AC: `npm run typecheck` runs `tsc --noEmit` with strict mode.
  - Source: `package.json:scripts`, `vitest.config.ts`
