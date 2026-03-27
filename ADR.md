# Architecture Decision Records — phenotype-auth-ts

**Package:** `@phenotype/auth-ts`
**Version:** 0.1.0
**Status:** Canonical ADR index (supersedes `adr/ADR-001-architecture.md`)

---

## ADR-001: Hexagonal Architecture for Authentication Domain

**Date:** 2026-03-27
**Status:** Accepted

**Context:**
The authentication library must be consumed by services with different token storage backends (Redis in production, in-memory in tests) and different JWT verification implementations (JWKS endpoint, local symmetric key, test stub). Without a clear boundary, consumer services become coupled to a single auth strategy and the library becomes untestable in isolation.

**Decision:**
Adopt hexagonal (ports and adapters) architecture with three distinct layers:
1. **Domain layer** (`src/domain/`) — pure TypeScript types with no runtime dependencies. Contains `Token`, `TokenRequest`, `TokenResponse` interfaces and typed `TokenError`/`AuthError` classes.
2. **Ports layer** (`src/ports/`) — inbound/outbound interface contracts. `TokenProvider` (outbound to IdP), `TokenStore` (outbound to storage), `TokenVerifier` (outbound to crypto/JWKS).
3. **Adapters layer** (`src/adapters/`) — concrete implementations. `MemoryTokenStore` for tests/dev; `PlaceholderJwtVerifier` as reference/test stub.

**Consequences:**
- Positive: Domain logic tests have zero async I/O dependencies.
- Positive: Production deployments swap `MemoryTokenStore` for Redis adapter without changing application code.
- Positive: `PlaceholderJwtVerifier` makes all `TokenVerifier` callers immediately testable.
- Negative: Every new auth strategy requires creating a new adapter file.
- Negative: Interface-only ports cannot encode complex behavioral contracts (mitigated by contract tests).
- Source: `src/domain/token.ts`, `src/ports/index.ts`, `src/adapters/`

---

## ADR-002: TypeScript ESM Modules with Zero Runtime Dependencies in Domain Layer

**Date:** 2026-03-27
**Status:** Accepted

**Context:**
The package targets TypeScript services on Node.js and Bun. Shipping CJS-only code blocks ESM-first runtimes. Bundling JWT libraries into the domain layer forces consumers to take on crypto dependencies they may not want, and prevents tree-shaking.

**Decision:**
Publish as ESM (`"type": "module"` in `package.json`). The domain layer (`src/domain/`) and ports layer (`src/ports/`) have **zero runtime npm dependencies**. Adapters are the only place third-party libraries appear. The JWT verifier adapter (`PlaceholderJwtVerifier`) is explicitly a stub — production users replace it with `jose` or similar JWKS library.

**Consequences:**
- Positive: `@phenotype/auth-ts` installs with 0 production `node_modules`.
- Positive: Domain types are importable in edge runtimes (Cloudflare Workers, Bun).
- Negative: Consumers must supply their own JWT implementation and wire it via the `TokenVerifier` port.
- Source: `package.json` — `"type": "module"`, no `dependencies` key; `src/adapters/jwt-provider.ts` comment "swap for jose/jwks in production"

---

## ADR-003: Typed Error Hierarchy Following OAuth2 RFC 6749

**Date:** 2026-03-27
**Status:** Accepted

**Context:**
OAuth2 error responses have standardized `error` codes (`invalid_request`, `invalid_client`, `invalid_grant`, `unauthorized_client`, `unsupported_grant_type`). Using untyped `Error` objects makes it impossible for consumers to programmatically distinguish error types for retry, logging, or user-facing message selection.

**Decision:**
Define a `TokenError` class in `src/domain/token.ts` with `code: string` and `statusCode: number` fields matching RFC 6749 error codes. Provide static factory methods (`TokenError.invalidRequest()`, `TokenError.invalidClient()`, etc.) so error construction is self-documenting. Define a separate `AuthError` class in `src/domain/errors.ts` for authentication-layer errors (expired token, invalid signature, insufficient scope) distinct from OAuth2 grant errors.

**Consequences:**
- Positive: `instanceof TokenError` and `instanceof AuthError` branching in catch blocks is safe and explicit.
- Positive: HTTP status codes encoded in error objects remove the need for error-to-status mappings in HTTP handlers.
- Negative: Two error classes (`TokenError`, `AuthError`) cover overlapping ground; callers must understand the distinction.
- Source: `src/domain/token.ts:TokenError`, `src/domain/errors.ts:AuthError`, `src/domain/errors.ts:AuthErrors`

---

## ADR-004: Vitest as Test Runner with ESM-Native Configuration

**Date:** 2026-03-27
**Status:** Accepted

**Context:**
The project uses ESM modules. Jest requires transform configuration to handle `.ts` ESM files and has had persistent ESM interoperability issues. The test suite is unit-focused with no browser DOM requirements.

**Decision:**
Use Vitest v4.0+ (`"vitest": "^4.0.0"` in `devDependencies`) with a `vitest.config.ts` configuration file. TypeScript compilation uses `tsc` (v5.6+) with strict mode enabled in `tsconfig.json`.

**Consequences:**
- Positive: Vitest natively supports ESM without transform plugins.
- Positive: Vitest shares Vite's fast module graph; test startup is sub-200ms.
- Negative: Vitest's v4+ API has some breaking changes from v2/v3; version pinned to `^4.0.0`.
- Source: `package.json` — `"vitest": "^4.0.0"`, `vitest.config.ts`

---

## ADR-005: Explicit TTL-Based Token Expiry in MemoryTokenStore

**Date:** 2026-03-27
**Status:** Accepted

**Context:**
In-memory token storage without expiry leaks memory indefinitely in long-running processes and returns stale tokens after access tokens have expired at the IdP. Lazy expiry (check on read) is simpler than a background GC goroutine/timer and sufficient for test/dev use cases.

**Decision:**
`MemoryTokenStore.save(key, token, ttlSeconds)` stores the token alongside an absolute expiry timestamp (`Date.now() + ttlSeconds * 1000`). `MemoryTokenStore.get(key)` performs lazy expiry: if `Date.now() > expiryMs`, the entry is deleted and `null` returned. No background timer is started.

**Consequences:**
- Positive: Zero timer cleanup required; no async lifecycle management.
- Positive: Eviction is deterministic and testable without fake timers.
- Negative: Expired entries occupy memory until next `get()` call for that key (acceptable for dev/test usage only).
- Source: `src/adapters/memory-token-store.ts:MemoryTokenStore.get()`

---

## ADR-006: Port Interface Segregation — TokenProvider, TokenStore, TokenVerifier

**Date:** 2026-03-27
**Status:** Accepted

**Context:**
A monolithic `AuthClient` interface forces every adapter to implement token issuance, storage, and verification even when a service only needs one capability. This violates ISP (Interface Segregation Principle) and makes partial mocking unnecessarily complex.

**Decision:**
Define three separate port interfaces in `src/ports/index.ts`:
- `TokenProvider` — issues and refreshes tokens (talks to IdP)
- `TokenStore` — persists tokens by key with TTL (talks to cache/storage)
- `TokenVerifier` — validates JWTs and claim shapes (talks to JWKS or local key)

Each interface is independently implementable and mockable.

**Consequences:**
- Positive: A service that only validates inbound JWTs imports only `TokenVerifier`; never pulled into token issuance logic.
- Positive: Mock objects in tests are minimal — implement only the one interface under test.
- Negative: Services needing all three capabilities must wire three dependencies rather than one.
- Source: `src/ports/index.ts` — `TokenProvider`, `TokenStore`, `TokenVerifier` interfaces
