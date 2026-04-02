/**
 * Integration tests for OAuth2 PKCE flow.
 *
 * xDD Methodologies:
 * - TDD: Test-first for PKCE implementation
 * - BDD: Given-When-Then scenario format
 *
 * Traces to: FR-FLOW-001
 */

import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  createPkcePair,
  verifyPkce,
  buildAuthorizationUrl,
  OAuth2PkceFlow,
} from '../../src/adapters/oauth2-pkce';

describe('PKCE Utilities', () => {
  // Traces to: FR-FLOW-001
  it('BDD: Given a random input, When generating verifier, Then result is valid base64url', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  // Traces to: FR-FLOW-001
  it('TDD: Given a verifier, When generating challenge, Then challenge is deterministic', () => {
    const verifier = 'test-verifier-string-12345678901234567890123456789012';
    const challenge1 = generateCodeChallenge(verifier);
    const challenge2 = generateCodeChallenge(verifier);
    expect(challenge1).toBe(challenge2);
  });

  // Traces to: FR-FLOW-001
  it('TDD: Given a verifier, When verifying against challenge, Then result is true', () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    expect(verifyPkce(verifier, challenge)).toBe(true);
  });

  // Traces to: FR-FLOW-001
  it('TDD: Given wrong verifier, When verifying, Then result is false', () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    const wrongVerifier = generateCodeVerifier();
    expect(verifyPkce(wrongVerifier, challenge)).toBe(false);
  });

  // Traces to: FR-FLOW-001
  it('TDD: createPkcePair generates valid pair', () => {
    const pkce = createPkcePair();
    expect(pkce).toHaveProperty('verifier');
    expect(pkce).toHaveProperty('challenge');
    expect(pkce.method).toBe('S256');
    expect(verifyPkce(pkce.verifier, pkce.challenge)).toBe(true);
  });
});

describe('Authorization URL Builder', () => {
  // Traces to: FR-FLOW-001
  it('BDD: Given valid options, When building URL, Then contains required params', () => {
    const pkce = createPkcePair();
    const { url } = buildAuthorizationUrl({
      authorizationEndpoint: 'https://auth.example.com/authorize',
      clientId: 'my-client',
      redirectUri: 'https://myapp.com/callback',
      scope: 'openid profile',
      state: 'random-state',
      codeChallenge: pkce.challenge,
      codeChallengeMethod: 'S256',
    });

    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=my-client');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=');
    expect(url).toContain('state=random-state');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
  });

  // Traces to: FR-FLOW-001
  it('TDD: State is generated if not provided', () => {
    const pkce = createPkcePair();
    const { url, state } = buildAuthorizationUrl({
      authorizationEndpoint: 'https://auth.example.com/authorize',
      clientId: 'my-client',
      redirectUri: 'https://myapp.com/callback',
      codeChallenge: pkce.challenge,
      codeChallengeMethod: 'S256',
    });

    expect(state).toBeDefined();
    expect(state.length).toBeGreaterThan(0);
    expect(url).toContain(`state=${state}`);
  });
});

describe('OAuth2PkceFlow', () => {
  // Traces to: FR-FLOW-001
  it('BDD: Given flow setup, When getting auth URL, Then URL is valid and verifier stored', () => {
    const flow = new OAuth2PkceFlow({
      authorizationEndpoint: 'https://auth.example.com/authorize',
      tokenEndpoint: 'https://auth.example.com/token',
      clientId: 'my-client',
      redirectUri: 'https://myapp.com/callback',
      scope: 'openid profile',
    });

    const { url, state, codeVerifier } = flow.getAuthorizationUrl();

    expect(url).toContain('response_type=code');
    expect(state).toBeDefined();
    expect(codeVerifier).toBeDefined();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
  });

  // Traces to: FR-FLOW-001
  it('TDD: exchangeCode throws for unknown state', async () => {
    const flow = new OAuth2PkceFlow({
      authorizationEndpoint: 'https://auth.example.com/authorize',
      tokenEndpoint: 'https://auth.example.com/token',
      clientId: 'my-client',
      redirectUri: 'https://myapp.com/callback',
    });

    await expect(flow.exchangeCode('auth-code', 'unknown-state')).rejects.toThrow(
      'Invalid state'
    );
  });

  // Traces to: FR-FLOW-001
  it('TDD: exchangeCode throws for expired code after use', async () => {
    const flow = new OAuth2PkceFlow({
      authorizationEndpoint: 'https://auth.example.com/authorize',
      tokenEndpoint: 'https://auth.example.com/token',
      clientId: 'my-client',
      redirectUri: 'https://myapp.com/callback',
    });

    const { state } = flow.getAuthorizationUrl();

    // First exchange should fail (no mock server)
    await expect(flow.exchangeCode('auth-code', state)).rejects.toThrow();

    // Second exchange with same state should also fail (state already consumed)
    await expect(flow.exchangeCode('auth-code', state)).rejects.toThrow('Invalid state');
  });
});
