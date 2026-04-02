/**
 * Unit tests for JoseJwtVerifier.
 *
 * xDD Methodologies:
 * - TDD: Test-first for JWT verification
 * - BDD: Given-When-Then scenario format
 *
 * Traces to: FR-ADAPT-003
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { JoseJwtVerifier } from '../../src/adapters/jwt-provider';
import { SignJWT } from 'jose';

// Generate test RSA keys
const generateTestKeys = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);

  return {
    privateKey: Buffer.from(privateKey).toString('base64'),
    publicKey: Buffer.from(publicKey).toString('base64'),
  };
};

// Convert base64 to PEM format
const toPublicKeyPem = (base64: string): string => {
  return `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
};

describe('JoseJwtVerifier', () => {
  let keys: Awaited<ReturnType<typeof generateTestKeys>>;

  beforeAll(async () => {
    keys = await generateTestKeys();
  });

  describe('configuration', () => {
    // Traces to: FR-ADAPT-003
    it('TDD: Given no key source configured, When verifying, Then throws PROVIDER_ERROR', async () => {
      const verifier = new JoseJwtVerifier({});

      await expect(verifier.verify('any-token')).rejects.toThrow('No key source configured');
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given public key config, When creating verifier, Then no error', () => {
      const verifier = new JoseJwtVerifier({
        publicKey: toPublicKeyPem(keys.publicKey),
      });

      expect(verifier).toBeDefined();
    });
  });

  describe('JWT verification', () => {
    // Traces to: FR-ADAPT-003
    it('TDD: Given no key source, When verifying, Then throws', async () => {
      const verifier = new JoseJwtVerifier({});

      await expect(verifier.verify('invalid-token')).rejects.toThrow();
    });
  });

  describe('validateClaims', () => {
    // Traces to: FR-ADAPT-003
    it('TDD: Given valid claims with required claims, When validating, Then returns true', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { sub: 'user-123', iss: 'issuer', aud: 'audience' };

      const result = await verifier.validateClaims(claims, {
        requiredClaims: ['sub'],
        expectedIssuer: 'issuer',
        expectedAudience: 'audience',
      });

      expect(result).toBe(true);
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given missing required claim, When validating, Then throws', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { iss: 'issuer' };

      await expect(verifier.validateClaims(claims, {
        requiredClaims: ['sub'],
      })).rejects.toThrow('missing required claim');
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given wrong issuer, When validating, Then throws', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { sub: 'user-123', iss: 'wrong-issuer' };

      await expect(verifier.validateClaims(claims, {
        expectedIssuer: 'expected-issuer',
      })).rejects.toThrow('Claim iss must be expected-issuer');
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given string audience match, When validating, Then returns true', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { aud: 'my-app' };

      const result = await verifier.validateClaims(claims, {
        expectedAudience: 'my-app',
      });

      expect(result).toBe(true);
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given array audience with match, When validating, Then returns true', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { aud: ['app1', 'app2', 'app3'] };

      const result = await verifier.validateClaims(claims, {
        expectedAudience: 'app2',
      });

      expect(result).toBe(true);
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given audience mismatch, When validating, Then throws', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { aud: 'my-app' };

      await expect(verifier.validateClaims(claims, {
        expectedAudience: 'other-app',
      })).rejects.toThrow('Claim aud must be other-app');
    });

    // Traces to: FR-ADAPT-003
    it('TDD: Given no validation options, When validating, Then returns true', async () => {
      const verifier = new JoseJwtVerifier({});
      const claims = { sub: 'user-123' };

      const result = await verifier.validateClaims(claims, {});

      expect(result).toBe(true);
    });
  });
});
