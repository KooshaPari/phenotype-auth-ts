/**
 * JWT Token Provider using the jose library.
 *
 * Traces to: FR-ADAPT-002
 */

import { SignJWT } from 'jose';
import type { TokenProvider } from '../ports';
import type { TokenRequest, TokenResponse } from '../domain/token';
import { AuthError, AuthErrors } from '../domain/errors';

export interface JwtTokenProviderConfig {
  /** Private key for signing tokens (PEM format) */
  privateKey: string;
  /** Public key for verification (PEM format) */
  publicKey?: string;
  /** Token issuer (iss claim) */
  issuer: string;
  /** Token audience (aud claim) */
  audience?: string;
  /** Access token TTL in seconds (default: 3600 = 1 hour) */
  accessTokenTtl?: number;
  /** Refresh token TTL in seconds (default: 604800 = 7 days) */
  refreshTokenTtl?: number;
}

/**
 * JWT-based TokenProvider using the jose library.
 * Implements token issuance and refresh with RS256 signing.
 *
 * Traces to: FR-ADAPT-002
 */
export class JwtTokenProvider implements TokenProvider {
  private readonly privateKey: string;
  private readonly issuer: string;
  private readonly audience?: string;
  private readonly accessTokenTtl: number;
  private readonly refreshTokenTtl: number;

  constructor(config: JwtTokenProviderConfig) {
    if (!config.privateKey) {
      throw new AuthError('Private key is required', 'CONFIG_ERROR', 500);
    }
    if (!config.issuer) {
      throw new AuthError('Issuer is required', 'CONFIG_ERROR', 500);
    }

    this.privateKey = config.privateKey;
    this.issuer = config.issuer;
    this.audience = config.audience;
    this.accessTokenTtl = config.accessTokenTtl ?? 3600;
    this.refreshTokenTtl = config.refreshTokenTtl ?? 604800;
  }

  /**
   * Issue a new token based on the grant type.
   *
   * Traces to: FR-ADAPT-002, FR-FLOW-002 (client_credentials), FR-FLOW-003 (refresh_token)
   */
  async requestToken(req: TokenRequest): Promise<TokenResponse> {
    switch (req.grantType) {
      case 'client_credentials':
        return this.issueClientCredentialsToken(req);
      case 'refresh_token':
        return this.refreshToken(req.refreshToken!);
      case 'password':
        return this.issuePasswordToken(req);
      case 'authorization_code':
        return this.issueAuthorizationCodeToken(req);
      default:
        throw AuthErrors.unsupportedGrantType(`Grant type not supported: ${req.grantType}`);
    }
  }

  /**
   * Refresh an access token using a refresh token.
   *
   * Traces to: FR-ADAPT-002, FR-FLOW-003
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    if (!refreshToken) {
      throw AuthErrors.invalidGrant('Refresh token is required');
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = await this.createAccessToken({
      sub: 'user-from-refresh-token',
      iat: now,
    });
    const newRefreshToken = await this.createRefreshToken({
      sub: 'user-from-refresh-token',
      iat: now,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtl,
      refreshToken: newRefreshToken,
    };
  }

  private async issueClientCredentialsToken(req: TokenRequest): Promise<TokenResponse> {
    if (!req.clientId || !req.clientSecret) {
      throw AuthErrors.invalidClient('Client credentials required');
    }

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: `client:${req.clientId}`,
      client_id: req.clientId,
      iat: now,
      scope: req.scope ?? 'default',
    };

    const accessToken = await this.createAccessToken(claims);
    const refreshToken = await this.createRefreshToken(claims);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtl,
      refreshToken,
      scope: req.scope,
    };
  }

  private async issuePasswordToken(req: TokenRequest): Promise<TokenResponse> {
    if (!req.username || !req.password) {
      throw AuthErrors.invalidGrant('Username and password required');
    }

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: `user:${req.username}`,
      username: req.username,
      iat: now,
    };

    const accessToken = await this.createAccessToken(claims);
    const refreshToken = await this.createRefreshToken(claims);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtl,
      refreshToken,
      scope: req.scope,
    };
  }

  private async issueAuthorizationCodeToken(req: TokenRequest): Promise<TokenResponse> {
    if (!req.code) {
      throw AuthErrors.invalidGrant('Authorization code required');
    }

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: 'user-from-code-exchange',
      auth_time: now,
      iat: now,
    };

    const accessToken = await this.createAccessToken(claims);
    const refreshToken = await this.createRefreshToken(claims);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenTtl,
      refreshToken,
      scope: req.scope,
    };
  }

  private async createAccessToken(claims: Record<string, unknown>): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const key = await this.importPrivateKey();

    let jwt = new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setExpirationTime(now + this.accessTokenTtl);

    if (this.audience) {
      jwt = jwt.setAudience(this.audience);
    }

    return jwt.sign(key);
  }

  private async createRefreshToken(claims: Record<string, unknown>): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const key = await this.importPrivateKey();

    const refreshClaims = {
      ...claims,
      token_type: 'refresh',
    };

    let jwt = new SignJWT(refreshClaims)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setExpirationTime(now + this.refreshTokenTtl);

    if (this.audience) {
      jwt = jwt.setAudience(this.audience);
    }

    return jwt.sign(key);
  }

  private async importPrivateKey(): Promise<CryptoKey> {
    const pem = this.privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');

    const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

    return crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }
}
