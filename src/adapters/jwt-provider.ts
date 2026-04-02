/**
 * JWT verification adapter using the jose library.
 *
 * Traces to: FR-ADAPT-003
 */

import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';
import type { JwtClaims } from '../domain/claims';
import type { ClaimsValidationOptions, TokenVerifier } from '../ports';
import { AuthError, AuthErrors } from '../domain/errors';

export interface JwtVerifierConfig {
  /** JWKS URL for remote key set (e.g., https://auth.example.com/.well-known/jwks.json) */
  jwksUrl?: string;
  /** Expected issuer (iss claim) */
  issuer?: string;
  /** Expected audience (aud claim) */
  audience?: string;
  /** Public key for single-key verification (alternative to JWKS) */
  publicKey?: string;
}

/**
 * Production-ready JWT verifier using the jose library.
 * Supports remote JWKS and local key verification.
 *
 * Traces to: FR-ADAPT-003
 */
export class JoseJwtVerifier implements TokenVerifier {
  private readonly getKeySet?: ReturnType<typeof createRemoteJWKSet>;
  private readonly publicKey?: string;
  private readonly expectedIssuer?: string;
  private readonly expectedAudience?: string;

  constructor(config: JwtVerifierConfig) {
    if (config.jwksUrl) {
      this.getKeySet = createRemoteJWKSet(new URL(config.jwksUrl));
    }
    this.publicKey = config.publicKey;
    this.expectedIssuer = config.issuer;
    this.expectedAudience = config.audience;
  }

  /**
   * Verify a JWT token and return claims.
   *
   * Traces to: FR-ADAPT-003
   */
  async verify(token: string): Promise<JwtClaims> {
    if (!this.getKeySet && !this.publicKey) {
      throw AuthErrors.PROVIDER_ERROR('No key source configured (JWKS or publicKey)');
    }

    try {
      let payload: JWTPayload;

      if (this.getKeySet) {
        // Use remote JWKS
        const result = await jwtVerify(token, this.getKeySet, {
          issuer: this.expectedIssuer,
          audience: this.expectedAudience,
        });
        payload = result.payload;
      } else if (this.publicKey) {
        // Use local public key (PEM format)
        const publicKey = await importSPKI(this.publicKey, 'RS256');
        const result = await jwtVerify(token, publicKey, {
          issuer: this.expectedIssuer,
          audience: this.expectedAudience,
        });
        payload = result.payload;
      } else {
        throw AuthErrors.PROVIDER_ERROR('No verification key available');
      }

      return payload as JwtClaims;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          throw AuthErrors.TOKEN_EXPIRED();
        }
        if (error.message.includes('signature')) {
          throw AuthErrors.INVALID_SIGNATURE();
        }
        throw new AuthError(error.message, 'INVALID_TOKEN', 401);
      }
      throw new AuthError('Unknown verification error', 'INVALID_TOKEN', 401);
    }
  }

  /**
   * Validate specific claims against expected values.
   *
   * Traces to: FR-ADAPT-003
   */
  async validateClaims(
    claims: JwtClaims,
    options: ClaimsValidationOptions
  ): Promise<boolean> {
    const required = options.requiredClaims ?? [];

    for (const key of required) {
      if (claims[key] === undefined && claims[key as keyof JwtClaims] === undefined) {
        throw AuthErrors.MISSING_CLAIM(key);
      }
    }

    if (options.expectedIssuer && claims.iss !== options.expectedIssuer) {
      throw AuthErrors.INVALID_CLAIM('iss', options.expectedIssuer);
    }

    if (options.expectedAudience !== undefined) {
      const aud = claims.aud;
      const expected = options.expectedAudience;
      const ok = Array.isArray(aud)
        ? aud.some((a) =>
            Array.isArray(expected) ? expected.includes(a) : a === expected
          )
        : aud === expected || (Array.isArray(expected) && expected.includes(aud as string));
      if (!ok) {
        throw AuthErrors.INVALID_CLAIM('aud', String(expected));
      }
    }

    return true;
  }
}

// Helper function to import SPKI key (needed for local key verification)
async function importSPKI(spki: string, _alg: string): Promise<CryptoKey> {
  const pem = spki.replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pem), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

/**
 * Placeholder JWT verifier for development/testing.
 * Always throws INVALID_TOKEN - replace with JoseJwtVerifier in production.
 *
 * @deprecated Use JoseJwtVerifier for production
 */
export class PlaceholderJwtVerifier implements TokenVerifier {
  async verify(_token: string): Promise<JwtClaims> {
    throw AuthErrors.INVALID_TOKEN();
  }

  async validateClaims(
    claims: JwtClaims,
    options: ClaimsValidationOptions
  ): Promise<boolean> {
    const required = options.requiredClaims ?? [];
    for (const key of required) {
      if (claims[key] === undefined && claims[key as keyof JwtClaims] === undefined) {
        throw AuthErrors.MISSING_CLAIM(key);
      }
    }
    if (options.expectedIssuer && claims.iss !== options.expectedIssuer) {
      throw AuthErrors.INVALID_CLAIM('iss', options.expectedIssuer);
    }
    const aud = claims.aud;
    if (options.expectedAudience !== undefined) {
      const expected = options.expectedAudience;
      const ok = Array.isArray(aud)
        ? aud.some((a) =>
            Array.isArray(expected) ? expected.includes(a) : a === expected
          )
        : aud === expected || (Array.isArray(expected) && expected.includes(aud as string));
      if (!ok) {
        throw AuthErrors.INVALID_CLAIM('aud', String(expected));
      }
    }
    return true;
  }
}
