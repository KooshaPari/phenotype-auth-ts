# Phenotype Auth (TypeScript)

> Authentication & Authorization Framework for Phenotype Platform

TypeScript-based authentication and authorization framework with support for multiple identity providers, JWT tokens, RBAC, and API key management.

## Features

- **Multi-Provider Support**: OAuth2, OIDC, SAML, LDAP
- **Token Management**: JWT with RS256, refresh tokens, token rotation
- **RBAC**: Role-based access control with policy engine
- **API Keys**: Secure API key generation and validation
- **MFA**: TOTP, WebAuthn, SMS-based MFA
- **Session Management**: Stateful sessions with Redis

## Architecture

```
Auth Architecture:
- Providers: OAuth2, OIDC, SAML, LDAP
- Tokens: JWT (RS256), Refresh, API Keys
- Authorization: RBAC, ABAC, Policy Engine
- Storage: PostgreSQL, Redis
- MFA: TOTP, WebAuthn, SMS
```

## Providers

| Provider | Protocol | Status |
|----------|----------|--------|
| Google | OAuth2/OIDC | Stable |
| GitHub | OAuth2 | Stable |
| Microsoft | OIDC | Stable |
| Auth0 | OIDC | Stable |
| Okta | OIDC/SAML | Stable |
| Custom | OAuth2/OIDC | Stable |

## Quick Start

```typescript
import { AuthProvider, GoogleOAuth2Config } from 'phenotype-auth-ts';

// Configure Google OAuth2
const auth = new AuthProvider({
  type: 'google-oauth2',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/auth/callback',
});

// Generate auth URL
const authUrl = auth.getAuthorizationUrl({
  scope: ['openid', 'profile', 'email'],
  state: crypto.randomUUID(),
});

// Exchange code for tokens
const tokens = await auth.exchangeCode(code);
console.log(tokens.accessToken);  // JWT
```

## Configuration

```yaml
# config/auth.yaml
providers:
  google:
    type: google-oauth2
    client_id: ${GOOGLE_CLIENT_ID}
    client_secret: ${GOOGLE_CLIENT_SECRET}
    redirect_uri: http://localhost:3000/auth/callback
    
  github:
    type: github-oauth2
    client_id: ${GITHUB_CLIENT_ID}
    client_secret: ${GITHUB_CLIENT_SECRET}

tokens:
  algorithm: RS256
  private_key: /etc/phenotype/jwt-private.pem
  public_key: /etc/phenotype/jwt-public.pem
  access_token_ttl: 15m
  refresh_token_ttl: 7d

rbac:
  roles:
    - name: admin
      permissions: ['*']
    - name: user
      permissions: ['read:profile', 'write:profile']
    - name: guest
      permissions: ['read:public']

mfa:
  enabled: true
  methods: [totp, webauthn]
  required_for_roles: [admin]

rate_limiting:
  login_attempts: 5
  window: 15m
```

## API

```typescript
// Validate JWT
const payload = await auth.validateToken(accessToken);

// Check permissions
const hasPermission = await auth.checkPermission(
  userId,
  'write:profile'
);

// Generate API key
const apiKey = await auth.generateApiKey({
  userId: 'user-123',
  scopes: ['read:profile'],
  expiresIn: '30d',
});
```

## References

- OAuth2: https://oauth.net/2/
- OIDC: https://openid.net/connect/
- JWT: https://jwt.io/
- WebAuthn: https://webauthn.io/
- Passkeys: https://passkeys.dev/