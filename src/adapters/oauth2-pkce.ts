/**
 * OAuth2 PKCE (Proof Key for Code Exchange) utilities.
 *
 * Implements RFC 7636 for enhanced security in authorization code flows.
 *
 * Traces to: FR-FLOW-001
 */

import { createHash, randomBytes } from 'crypto';

export interface PkcePair {
  verifier: string;
  challenge: string;
  method: 'S256';
}

/**
 * Generate a cryptographically random code verifier.
 * Must be between 43 and 128 characters.
 *
 * Traces to: FR-FLOW-001
 */
export function generateCodeVerifier(): string {
  return randomBytes(64)
    .toString('base64url')
    .slice(0, 128);
}

/**
 * Generate a code challenge from a verifier using S256 method.
 *
 * Traces to: FR-FLOW-001
 */
export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Create a PKCE pair (verifier + challenge).
 *
 * Traces to: FR-FLOW-001
 */
export function createPkcePair(): PkcePair {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  return { verifier, challenge, method: 'S256' };
}

/**
 * Verify that a code verifier matches its challenge.
 *
 * Traces to: FR-FLOW-001
 */
export function verifyPkce(verifier: string, challenge: string): boolean {
  const computed = generateCodeChallenge(verifier);
  return computed === challenge;
}

export interface AuthorizationUrlOptions {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * Build an authorization URL for OAuth2 authorization code flow with PKCE.
 *
 * Traces to: FR-FLOW-001
 *
 * @example
 * ```typescript
 * const { url, state, verifier } = buildAuthorizationUrl({
 *   authorizationEndpoint: 'https://auth.example.com/authorize',
 *   clientId: 'my-client',
 *   redirectUri: 'https://myapp.com/callback',
 *   scope: 'openid profile',
 * });
 * // Store verifier securely for later token exchange
 * ```
 */
export function buildAuthorizationUrl(options: AuthorizationUrlOptions): {
  url: string;
  state: string;
} {
  const state = options.state ?? randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    scope: options.scope ?? '',
    state,
    code_challenge: options.codeChallenge,
    code_challenge_method: options.codeChallengeMethod,
  });

  const url = `${options.authorizationEndpoint}?${params.toString()}`;

  return { url, state };
}

export interface TokenExchangeOptions {
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

/**
 * Exchange authorization code for tokens.
 *
 * Traces to: FR-FLOW-001
 */
export async function exchangeCodeForToken(
  options: TokenExchangeOptions,
  fetchFn: typeof fetch = globalThis.fetch
): Promise<TokenExchangeResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: options.clientId,
    code: options.code,
    redirect_uri: options.redirectUri,
    code_verifier: options.codeVerifier,
  });

  if (options.clientSecret) {
    body.set('client_secret', options.clientSecret);
  }

  const response = await fetchFn(options.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${error.error_description ?? response.statusText}`);
  }

  return response.json();
}

export interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * OAuth2 Authorization Code Flow with PKCE helper class.
 *
 * Traces to: FR-FLOW-001
 */
export class OAuth2PkceFlow {
  private readonly authorizationEndpoint: string;
  private readonly tokenEndpoint: string;
  private readonly clientId: string;
  private readonly clientSecret?: string;
  private readonly redirectUri: string;
  private readonly scope?: string;

  // In production, use secure storage instead of in-memory
  private pendingCodes = new Map<string, { verifier: string; state: string }>();

  constructor(options: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scope?: string;
  }) {
    this.authorizationEndpoint = options.authorizationEndpoint;
    this.tokenEndpoint = options.tokenEndpoint;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
  }

  /**
   * Generate authorization URL and store PKCE verifier.
   *
   * Traces to: FR-FLOW-001
   */
  getAuthorizationUrl(state?: string): { url: string; state: string; codeVerifier: string } {
    const pkce = createPkcePair();

    const { url, state: generatedState } = buildAuthorizationUrl({
      authorizationEndpoint: this.authorizationEndpoint,
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scope: this.scope,
      state,
      codeChallenge: pkce.challenge,
      codeChallengeMethod: pkce.method,
    });

    this.pendingCodes.set(generatedState, {
      verifier: pkce.verifier,
      state: generatedState,
    });

    return { url, state: generatedState, codeVerifier: pkce.verifier };
  }

  /**
   * Exchange authorization code for tokens.
   *
   * Traces to: FR-FLOW-001
   */
  async exchangeCode(
    code: string,
    state: string,
    fetchFn: typeof fetch = globalThis.fetch
  ): Promise<TokenExchangeResponse> {
    const pending = this.pendingCodes.get(state);
    if (!pending) {
      throw new Error('Invalid state or authorization code expired');
    }

    this.pendingCodes.delete(state);

    return exchangeCodeForToken({
      tokenEndpoint: this.tokenEndpoint,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      code,
      redirectUri: this.redirectUri,
      codeVerifier: pending.verifier,
    }, fetchFn);
  }
}
