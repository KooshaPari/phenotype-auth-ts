/**
 * Integration tests for token provider and store combination.
 *
 * xDD Methodologies:
 * - BDD: End-to-end token lifecycle scenarios
 * - CDD: Contract verification between adapters
 *
 * Traces to: FR-FLOW-002, FR-FLOW-003
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTokenStore } from '../../src/adapters/memory-token-store';
import { asToken } from '../../src/adapters/memory-token-store';

describe('MemoryTokenStore Integration', () => {
  // Traces to: FR-ADAPT-001
  it('BDD: Given a token lifecycle, When saving and retrieving, Then token persists', async () => {
    const store = new MemoryTokenStore();
    const key = 'user:integration-test';
    const token = { accessToken: 'test-token-123', tokenType: 'Bearer', expiresAt: Date.now() + 3600000 };

    await store.save(key, token, 3600);
    const retrieved = await store.get(key);

    expect(retrieved).toEqual(token);
  });

  // Traces to: FR-ADAPT-001
  it('BDD: Given multiple tokens, When saving, Then each can be retrieved independently', async () => {
    const store = new MemoryTokenStore();

    await store.save('user:1', { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: Date.now() + 3600000 }, 3600);
    await store.save('user:2', { accessToken: 'token-2', tokenType: 'Bearer', expiresAt: Date.now() + 3600000 }, 3600);

    const token1 = await store.get('user:1');
    const token2 = await store.get('user:2');

    expect((token1 as any).accessToken).toBe('token-1');
    expect((token2 as any).accessToken).toBe('token-2');
  });

  // Traces to: FR-ADAPT-001
  it('TDD: Deleting one token does not affect others', async () => {
    const store = new MemoryTokenStore();

    await store.save('user:1', { accessToken: 'token-1', tokenType: 'Bearer', expiresAt: Date.now() + 3600000 }, 3600);
    await store.save('user:2', { accessToken: 'token-2', tokenType: 'Bearer', expiresAt: Date.now() + 3600000 }, 3600);

    await store.delete('user:1');

    expect(await store.get('user:1')).toBeNull();
    expect(await store.get('user:2')).not.toBeNull();
  });
});

describe('Token Type Narrowing Integration', () => {
  // Traces to: FR-DOMAIN-001
  it('TDD: asToken correctly narrows valid tokens', () => {
    const validToken = { accessToken: 'test', tokenType: 'Bearer', expiresAt: Date.now() + 3600000 };
    const narrowed = asToken(validToken);

    expect(narrowed).toEqual(validToken);
  });

  // Traces to: FR-DOMAIN-001
  it('TDD: asToken returns null for invalid tokens', () => {
    const invalidToken = { tokenType: 'Bearer' };
    const narrowed = asToken(invalidToken);

    expect(narrowed).toBeNull();
  });

  // Traces to: FR-DOMAIN-001
  it('TDD: asToken handles edge cases', () => {
    expect(asToken(null)).toBeNull();
    expect(asToken(undefined)).toBeNull();
    expect(asToken({})).toBeNull();
    expect(asToken('string')).toBeNull();
    expect(asToken(123)).toBeNull();
    expect(asToken({ accessToken: 123 })).toBeNull();
  });
});
