# phenotype-auth-ts

TypeScript authentication and authorization library for Phenotype services. Provides OAuth 2.0, OIDC, API key, and WebAuthn support with hexagonal architecture enabling easy testing and flexible token/session management.

## Overview

**phenotype-auth-ts** is the official TypeScript authentication library for the Phenotype platform. Built with hexagonal architecture (domain layer, ports, and adapters), it provides flexible, testable authentication and authorization patterns that work seamlessly in browsers, Node.js, and edge runtimes.

**Core Mission**: Enable secure, flexible authentication in TypeScript applications with minimal boilerplate while maintaining clear separation between domain logic, abstractions, and implementation details.

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Authentication Protocols**: OAuth 2.0, OpenID Connect (OIDC), API Key, WebAuthn
- **Runtimes**: Node.js, browsers (with polyfills), edge runtimes (Cloudflare Workers)
- **Build**: esbuild for bundling, TypeScript compiler for types
- **Testing**: Jest with TypeScript support
- **Architecture**: Hexagonal (ports and adapters pattern)

## Key Features

- **OAuth 2.0 / OIDC**: Full protocol support with Authorization Code, PKCE flows
- **API Key Authentication**: Simple key-based auth with rotation support
- **WebAuthn**: Passwordless authentication via biometrics and security keys
- **Token Management**: JWT parsing, validation, refresh logic
- **Session Management**: In-memory and persistent session stores
- **Hexagonal Architecture**: Domain layer, ports (interfaces), and swappable adapters
- **Type Safety**: Full TypeScript strict mode compliance
- **Cross-Runtime**: Works in browsers, Node.js, and edge environments

## Quick Start

```bash
# Clone and explore
git clone <repo-url>
cd phenotype-auth-ts

# Review governance and architecture
cat CLAUDE.md          # Project governance
cat adr/ADR-001-architecture.md  # Architecture decision records

# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build

# Lint and format
npm run lint
npm run format
```

## Project Structure

```
phenotype-auth-ts/
├── src/
│   ├── domain/
│   │   ├── token.ts           # Token domain types
│   │   ├── claims.ts          # JWT claims and payloads
│   │   ├── session.ts         # Session domain entity
│   │   ├── errors.ts          # Domain-specific errors
│   │   └── index.ts           # Domain exports
│   ├── ports/
│   │   ├── tokenProvider.ts   # Output port: token creation
│   │   ├── tokenStore.ts      # Output port: token persistence
│   │   ├── tokenVerifier.ts   # Output port: token validation
│   │   ├── sessionStore.ts    # Output port: session persistence
│   │   └── index.ts           # Port exports
│   ├── adapters/
│   │   ├── memory/
│   │   │   ├── memoryTokenStore.ts   # In-memory token storage
│   │   │   └── memorySessionStore.ts # In-memory sessions
│   │   ├── jwt/
│   │   │   ├── jwtProvider.ts       # JWT token provider
│   │   │   ├── jwtVerifier.ts       # JWT verification
│   │   │   └── jwks.ts              # JWKS endpoint integration
│   │   ├── oauth/
│   │   │   ├── authorizationCode.ts # OAuth2 Authorization Code flow
│   │   │   ├── pkce.ts              # PKCE support
│   │   │   └── tokenExchange.ts     # Token endpoint handling
│   │   ├── oidc/
│   │   │   ├── discoveryClient.ts   # OIDC discovery integration
│   │   │   ├── userInfo.ts          # UserInfo endpoint handling
│   │   │   └── idTokenVerifier.ts   # ID token validation
│   │   ├── webauthn/
│   │   │   ├── credentialManager.ts # WebAuthn credential management
│   │   │   └── verifier.ts          # WebAuthn verification
│   │   └── apiKey/
│   │       ├── keyValidator.ts      # API key validation
│   │       └── keyRotation.ts       # Key rotation logic
│   ├── application/
│   │   ├── authService.ts     # Main auth service (use case orchestrator)
│   │   ├── sessionManager.ts  # Session management use case
│   │   └── tokenManager.ts    # Token lifecycle management
│   └── index.ts               # Public API exports
├── adr/
│   ├── ADR-001-architecture.md      # Hexagonal architecture
│   ├── ADR-002-token-flow.md        # Token lifecycle
│   └── ADR-003-adapter-selection.md # Adapter selection guide
├── examples/
│   ├── oauth2-flow.ts         # OAuth 2.0 Authorization Code example
│   ├── jwt-validation.ts      # JWT validation example
│   ├── api-key-auth.ts        # API key authentication example
│   ├── webauthn-register.ts   # WebAuthn registration flow
│   └── custom-adapter.ts      # Custom adapter implementation
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── adapters/
│   │   └── application/
│   ├── integration/
│   │   ├── oauth-flow.test.ts
│   │   └── webauthn.test.ts
│   └── fixtures/
├── docs/
│   ├── ARCHITECTURE.md        # Detailed architecture guide
│   ├── OAUTH2_GUIDE.md        # OAuth 2.0 integration guide
│   ├── OIDC_GUIDE.md          # OpenID Connect guide
│   ├── JWT_GUIDE.md           # JWT handling guide
│   ├── WEBAUTHN_GUIDE.md      # WebAuthn guide
│   ├── CUSTOM_ADAPTERS.md     # Creating custom adapters
│   └── MIGRATION.md           # Migration guide
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.json
└── README.md
```

## Hexagonal Architecture Overview

```
Domain Layer (core business logic)
├── Token (entity)
├── Claims (value object)
├── Session (aggregate)
└── Errors (domain exceptions)
        ↓
Ports Layer (abstractions/interfaces)
├── TokenProvider (output port)
├── TokenStore (output port)
├── TokenVerifier (output port)
└── SessionStore (output port)
        ↓
Adapters Layer (implementation)
├── Memory (in-memory storage)
├── JWT (token provider/verifier)
├── OAuth (protocol handler)
├── OIDC (protocol handler)
├── WebAuthn (credential handler)
└── API Key (key validator)
```

## Usage Examples

### OAuth 2.0 with PKCE

```typescript
import { AuthService } from '@phenotype/auth-ts';
import { JwtVerifier } from '@phenotype/auth-ts/adapters/jwt';
import { MemoryTokenStore } from '@phenotype/auth-ts/adapters/memory';

const authService = new AuthService({
  tokenVerifier: new JwtVerifier({ issuer: 'https://auth.example.com' }),
  tokenStore: new MemoryTokenStore(),
});

// Initiate OAuth flow
const authUrl = authService.initiateOAuth({
  clientId: 'my-app',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['openid', 'profile'],
  usePkce: true,
});
```

### API Key Authentication

```typescript
import { ApiKeyValidator } from '@phenotype/auth-ts/adapters/apiKey';

const validator = new ApiKeyValidator();
const isValid = await validator.validate('sk_live_abc123xyz');
```

### WebAuthn Registration

```typescript
import { CredentialManager } from '@phenotype/auth-ts/adapters/webauthn';

const credMgr = new CredentialManager();
const challenge = await credMgr.createRegistrationChallenge('user@example.com');
const credential = await credMgr.verifyRegistration(challenge, response);
```

## Related Phenotype Projects

- **AuthKit**: Unified auth backend (phenotype-auth-ts provides client SDKs)
- **phenotype-ops-mcp**: MCP server for auth management and configuration
- **cloud**: Multi-tenant platform (primary auth-ts consumer)
- **PhenoLibs**: Shared utilities and error handling
- **AgilePlus**: Work tracking (integrates auth-ts for user identity)

## License

MIT
