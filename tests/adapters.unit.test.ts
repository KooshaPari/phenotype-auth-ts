/**
 * Adapter Unit Tests
 *
 * xDD Methodologies:
 * - TDD: Unit tests for concrete adapter implementations
 * - BDD: Given-When-Then scenario format
 * - CDD: Contract verification for adapter behavior
 *
 * Traces to:
 * - FR-ADAPT-001: MemoryTokenStore adapter
 * - FR-ADAPT-003: JwtTokenVerifier adapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTokenStore, asToken } from '../src/adapters/memory-token-store';
import { PlaceholderJwtVerifier } from '../src/adapters/jwt-provider';
import type { Token } from '../src/domain/token';

// ============================================================================
// MemoryTokenStore Tests
// Traces to: FR-ADAPT-001
// ============================================================================

describe('MemoryTokenStore', () => {
  let store: MemoryTokenStore;

  beforeEach(() => {
    store = new MemoryTokenStore();
  });

  describe('save', () => {
    // Traces to: FR-ADAPT-001
    it('BDD: Given a token and TTL, When saved, Then it can be retrieved', async () => {
      const token = { accessToken: 'test-token', tokenType: 'Bearer' };
      await store.save('user:123', token, 3600);
      const retrieved = await store.get('user:123');
      expect(retrieved).toEqual(token);
    });

    // Traces to: FR-ADAPT-001
    it('TDD: save overwrites existing entry with same key', async () => {
      await store.save('user:123', { accessToken: 'old' }, 3600);
      const newToken = { accessToken: 'new', tokenType: 'Bearer' };
      await store.save('user:123', newToken, 3600);
      const retrieved = await store.get('user:123');
      expect((retrieved as Token).accessToken).toBe('new');
    });
  });

  describe('get', () => {
    // Traces to: FR-ADAPT-001
    it('BDD: Given a saved token, When retrieved, Then it is returned', async () => {
      const token = { accessToken: 'test', tokenType: 'Bearer' };
      await store.save('user:123', token, 3600);
      const retrieved = await store.get('user:123');
      expect(retrieved).toEqual(token);
    });

    // Traces to: FR-ADAPT-001
    it('BDD: Given no saved token, When retrieved, Then null is returned', async () => {
      const retrieved = await store.get('nonexistent:key');
      expect(retrieved).toBeNull();
    });

    // Traces to: FR-ADAPT-001
    it('CDD: Given expired token, When retrieved, Then null is returned', async () => {
      await store.save('expired', { accessToken: 'old' }, -1);
      const first = await store.get('expired');
      const second = await store.get('expired');
      expect(first).toBeNull();
      expect(second).toBeNull();
    });
  });

  describe('delete', () => {
    // Traces to: FR-ADAPT-001
    it('BDD: Given a saved token, When deleted, Then it cannot be retrieved', async () => {
      await store.save('user:123', { accessToken: 'test' }, 3600);
      await store.delete('user:123');
      expect(await store.get('user:123')).toBeNull();
    });

    // Traces to: FR-ADAPT-001
    it('TDD: Deleting nonexistent key does not throw', async () => {
      await store.delete('nonexistent');
      // Should complete without throwing
    });
  });
});

// ============================================================================
// asToken Helper Tests
// Traces to: FR-DOMAIN-001
// ============================================================================

describe('asToken', () => {
  // Traces to: FR-DOMAIN-001
  it('TDD: Given valid token object, When narrowed, Then returns Token', () => {
    const valid = { accessToken: 'test', tokenType: 'Bearer' };
    expect(asToken(valid)).toEqual(valid);
  });

  // Traces to: FR-DOMAIN-001
  it('TDD: Given object without accessToken, When narrowed, Then returns null', () => {
    const invalid = { tokenType: 'Bearer' };
    expect(asToken(invalid)).toBeNull();
  });

  // Traces to: FR-DOMAIN-001
  it('TDD: Given null, When narrowed, Then returns null', () => {
    expect(asToken(null)).toBeNull();
    expect(asToken('string')).toBeNull();
    expect(asToken(123)).toBeNull();
  });
});

// ============================================================================
// PlaceholderJwtVerifier Tests
// Traces to: FR-ADAPT-003
// ============================================================================

describe('PlaceholderJwtVerifier', () => {
  let verifier: PlaceholderJwtVerifier;

  beforeEach(() => {
    verifier = new PlaceholderJwtVerifier();
  });

  describe('verify', () => {
    // Traces to: FR-ADAPT-003
    it('CDD: Given any token, When verified, Then throws INVALID_TOKEN', async () => {
      await expect(verifier.verify('any-token')).rejects.toThrow('Token is invalid or malformed');
    });
  });

  describe('validateClaims', () => {
    // Traces to: FR-ADAPT-003
    it('BDD: Given valid claims, When validated, Then returns true', async () => {
      const claims = { sub: 'user-123', iss: 'issuer', aud: 'audience' };
      const result = await verifier.validateClaims(claims, {
        requiredClaims: ['sub', 'iss'],
        expectedIssuer: 'issuer',
        expectedAudience: 'audience',
      });
      expect(result).toBe(true);
    });

    // Traces to: FR-ADAPT-003
    it('BDD: Given missing required claim, When validated, Then throws MISSING_CLAIM', async () => {
      const claims = { iss: 'issuer' };
      await expect(
        verifier.validateClaims(claims, { requiredClaims: ['sub'] })
      ).rejects.toThrow('Token missing required claim: sub');
    });

    // Traces to: FR-ADAPT-003
    it('BDD: Given wrong issuer, When validated, Then throws INVALID_CLAIM', async () => {
      const claims = { sub: 'user-123', iss: 'wrong-issuer' };
      await expect(
        verifier.validateClaims(claims, { expectedIssuer: 'expected-issuer' })
      ).rejects.toThrow('Claim iss must be expected-issuer');
    });

    // Traces to: FR-ADAPT-003
    it('BDD: Given array audience with match, When validated, Then returns true', async () => {
      const claims = { aud: ['aud1', 'aud2'] };
      const result = await verifier.validateClaims(claims, {
        expectedAudience: 'aud2',
      });
      expect(result).toBe(true);
    });

    // Traces to: FR-ADAPT-003
    it('BDD: Given array audience without match, When validated, Then throws', async () => {
      const claims = { aud: ['aud1', 'aud2'] };
      await expect(
        verifier.validateClaims(claims, { expectedAudience: 'aud3' })
      ).rejects.toThrow('Claim aud must be aud3');
    });
  });
});
