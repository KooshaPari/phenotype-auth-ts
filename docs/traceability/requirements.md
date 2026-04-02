# Requirements Traceability

Maps functional requirements to implementation artifacts.

## Domain Requirements

| FR ID | Requirement | Implementation | Tests |
|-------|-------------|----------------|-------|
| FR-DOMAIN-001 | AccessToken, RefreshToken, TokenClaims | `src/domain/token.ts` | Yes |
| FR-DOMAIN-002 | AuthError discriminated union | `src/domain/errors.ts` | Partial |
| FR-DOMAIN-003 | Token expiry as value object | Planned | No |
| FR-DOMAIN-004 | Token revocation | `src/domain/token.ts` | Yes |

## Port Requirements

| FR ID | Requirement | Implementation | Tests |
|-------|-------------|----------------|-------|
| FR-PORTS-001 | TokenProvider with issue/refresh | `src/ports/index.ts` | Yes |
| FR-PORTS-002 | TokenStore with save/find/revoke | `src/ports/index.ts` | Yes |
| FR-PORTS-003 | TokenVerifier with verify | `src/ports/index.ts` | Yes |

## Adapter Requirements

| FR ID | Requirement | Implementation | Tests |
|-------|-------------|----------------|-------|
| FR-ADAPT-001 | MemoryTokenStore | `src/adapters/memory-token-store.ts` | Yes |
| FR-ADAPT-002 | JwtTokenProvider | `src/adapters/jwt-token-provider.ts` | No |
| FR-ADAPT-003 | JwtTokenVerifier | `src/adapters/jwt-provider.ts` | Yes |
