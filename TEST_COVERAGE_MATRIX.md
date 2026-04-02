# Test Coverage Matrix

**Project**: phenotype-auth-ts  
**Document Version**: 1.0  
**Last Updated**: 2026-04-02

---

## Coverage Summary

| Metric | Value |
|--------|-------|
| Functional Requirements | 13 defined |
| Test Files | 5 |
| Test Functions | 53 |
| Coverage Target | 80% |
| Current Coverage | ~65% (estimated) |

---

## Test Categories

### Unit Tests
- **Location**: `tests/` directory
- **Purpose**: Test individual components in isolation
- **Current**: 4 test files (adapters.unit.test.ts, jwt-token-provider.unit.test.ts, etc.)
- **Coverage Target**: 90%
- **Current Status**: ~85%

### Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test component interactions
- **Current**: 2 test files (pkce.integration.test.ts, provider-store.integration.test.ts)
- **Coverage Target**: 75%
- **Current Status**: ~60%

### Contract Tests (CDD)
- **Location**: `tests/token.contract.test.ts`
- **Purpose**: Verify port interface contracts
- **Coverage**: TokenProvider, TokenStore, TokenVerifier interfaces

---

## FR to Test Coverage Mapping

| FR ID | Description | Test Files | Coverage Status |
|-------|-------------|------------|-----------------|
| FR-DOMAIN-001 | AccessToken, RefreshToken, TokenClaims types | `token.contract.test.ts`, `adapters.unit.test.ts` | Covered |
| FR-DOMAIN-002 | AuthError discriminated union | `adapters.unit.test.ts` | Partial |
| FR-DOMAIN-003 | Token expiry as value object | None | Not Covered |
| FR-DOMAIN-004 | Token revocation as domain operation | `token.contract.test.ts` | Partial |
| FR-PORTS-001 | TokenProvider port with issue()/refresh() | `token.contract.test.ts` | Covered |
| FR-PORTS-002 | TokenStore port with save/find/revoke | `token.contract.test.ts`, `adapters.unit.test.ts` | Covered |
| FR-PORTS-003 | TokenVerifier port with verify() | `token.contract.test.ts`, `adapters.unit.test.ts` | Covered |
| FR-ADAPT-001 | MemoryTokenStore adapter | `adapters.unit.test.ts`, `provider-store.integration.test.ts` | Covered |
| FR-ADAPT-002 | JwtTokenProvider using jose | `jwt-token-provider.unit.test.ts` | Covered |
| FR-ADAPT-003 | JwtTokenVerifier adapter | `adapters.unit.test.ts` | Covered |
| FR-FLOW-001 | OAuth2 authorization code flow with PKCE | `pkce.integration.test.ts` | Covered |
| FR-FLOW-002 | Client credentials flow | `token.contract.test.ts`, `jwt-token-provider.unit.test.ts` | Covered |
| FR-FLOW-003 | Token refresh with rotation | `jwt-token-provider.unit.test.ts` | Covered |
| FR-MW-001 | Express/Fastify middleware | None | Not Covered |
| FR-MW-002 | Inject typed user claims into request | None | Not Covered |
| FR-MW-003 | Return 401 with structured error | None | Not Covered |

---

## Coverage Gaps

### Critical Gaps
1. **FR-MW-001/002/003**: No tests for Express/Fastify middleware implementations
2. **FR-DOMAIN-003**: Token expiry as value object not implemented
3. **FR-DOMAIN-004**: Token revocation not fully implemented

### Partial Coverage
1. **FR-DOMAIN-002**: AuthError union type not fully tested
2. **FR-PORTS-001/002/003**: Contract tests use mocks, need real adapter tests

---

## Recommendations

### Immediate Actions (High Priority)
1. Add unit tests for Express/Fastify middleware
2. Add integration tests with mock HTTP servers

### Short-term Actions (Medium Priority)
1. Add property-based tests (fast-check)
2. Add performance benchmarks
3. Implement FR-DOMAIN-003 (Token expiry value object)

### Long-term Actions
1. Add E2E tests with test OIDC provider
2. Add property-based tests for JWT validation edge cases

---

**Last Updated**: 2026-04-02
