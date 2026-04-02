/**
 * Unit tests for JwtTokenProvider.
 *
 * xDD Methodologies:
 * - TDD: Test-first for token issuance
 * - BDD: Given-When-Then scenario format
 *
 * Traces to: FR-ADAPT-002, FR-FLOW-002, FR-FLOW-003
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JwtTokenProvider } from '../../src/adapters/jwt-token-provider';

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

  const privateKeyExported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const publicKeyExported = await crypto.subtle.exportKey('spki', keyPair.publicKey);

  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${Buffer.from(privateKeyExported).toString('base64')}\n-----END PRIVATE KEY-----`;
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${Buffer.from(publicKeyExported).toString('base64')}\n-----END PUBLIC KEY-----`;

  return { privateKey: privateKeyPem, publicKey: publicKeyPem };
};

describe('JwtTokenProvider', () => {
  let provider: JwtTokenProvider;
  let keys: Awaited<ReturnType<typeof generateTestKeys>>;

  beforeEach(async () => {
    keys = await generateTestKeys();
    provider = new JwtTokenProvider({
      privateKey: keys.privateKey,
      issuer: 'https://auth.test.com',
      audience: 'test-api',
      accessTokenTtl: 3600,
      refreshTokenTtl: 604800,
    });
  });

  describe('requestToken', () => {
    // Traces to: FR-ADAPT-002, FR-FLOW-002
    it('BDD: Given client credentials, When requesting token, Then token is returned', async () => {
      const response = await provider.requestToken({
        grantType: 'client_credentials',
        clientId: 'test-client',
        clientSecret: 'test-secret',
        scope: 'read write',
      });

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('tokenType', 'Bearer');
      expect(response).toHaveProperty('expiresIn', 3600);
      expect(response).toHaveProperty('refreshToken');
      expect(response).toHaveProperty('scope', 'read write');
    });

    // Traces to: FR-ADAPT-002
    it('TDD: Given missing client credentials, When requesting token, Then throws', async () => {
      await expect(provider.requestToken({
        grantType: 'client_credentials',
        clientId: '',
      })).rejects.toThrow();
    });

    // Traces to: FR-ADAPT-002, FR-FLOW-003
    it('BDD: Given refresh token, When refreshing, Then new tokens returned', async () => {
      const response = await provider.requestToken({
        grantType: 'refresh_token',
        refreshToken: 'test-refresh-token',
        clientId: 'test-client',
      });

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
    });

    // Traces to: FR-ADAPT-002
    it('TDD: Given missing refresh token, When refreshing, Then throws', async () => {
      await expect(provider.requestToken({
        grantType: 'refresh_token',
        clientId: 'test-client',
      })).rejects.toThrow();
    });

    // Traces to: FR-ADAPT-002
    it('TDD: Given username/password, When requesting token, Then token is returned', async () => {
      const response = await provider.requestToken({
        grantType: 'password',
        clientId: 'test-client',
        username: 'testuser',
        password: 'testpass',
      });

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('tokenType', 'Bearer');
    });

    // Traces to: FR-ADAPT-002
    it('TDD: Given authorization code, When exchanging, Then token is returned', async () => {
      const response = await provider.requestToken({
        grantType: 'authorization_code',
        clientId: 'test-client',
        code: 'auth-code-123',
        redirectUri: 'https://app.com/callback',
      });

      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('tokenType', 'Bearer');
    });
  });

  describe('configuration', () => {
    // Traces to: FR-ADAPT-002
    it('TDD: Given missing private key, When creating provider, Then throws', () => {
      expect(() => new JwtTokenProvider({
        privateKey: '',
        issuer: 'https://auth.test.com',
      })).toThrow();
    });

    // Traces to: FR-ADAPT-002
    it('TDD: Given missing issuer, When creating provider, Then throws', () => {
      expect(() => new JwtTokenProvider({
        privateKey: 'invalid-key',
        issuer: '',
      })).toThrow();
    });

    // Traces to: FR-ADAPT-002
    it('TDD: Custom TTL values are respected', async () => {
      const customProvider = new JwtTokenProvider({
        privateKey: keys.privateKey,
        issuer: 'https://auth.test.com',
        accessTokenTtl: 7200,
        refreshTokenTtl: 1209600,
      });

      const response = await customProvider.requestToken({
        grantType: 'client_credentials',
        clientId: 'test-client',
        clientSecret: 'secret',
      });

      expect(response.expiresIn).toBe(7200);
    });
  });
});
