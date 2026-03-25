# phenotype-auth-ts

TypeScript OAuth2/OIDC authentication patterns following hexagonal architecture. Pluggable adapters for various identity providers.

## Features

- OAuth2 Authorization Code Flow
- OpenID Connect support
- JWT validation
- Refresh token handling
- Pluggable storage adapters
- Session management

## Installation

```bash
npm install @phenotype/auth-ts
```

## Usage

### Basic OAuth2

```typescript
import { OAuth2Client, InMemoryTokenStore } from '@phenotype/auth-ts';

const client = new OAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  authorizationUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['openid', 'profile', 'email'],
});

const token = await client.getAccessToken();
```

### JWT Validation

```typescript
import { JWTValidator } from '@phenotype/auth-ts';

const validator = new JWTValidator({
  issuer: 'https://auth.example.com',
  audience: 'your-api',
  jwksUri: 'https://auth.example.com/.well-known/jwks.json',
});

const claims = await validator.validate(token);
```

## Architecture

```
src/
├── domain/           # Core auth concepts
│   ├── Token.ts
│   ├── User.ts
│   └── Session.ts
├── application/       # Use cases
│   ├── AuthenticateUseCase.ts
│   └── RefreshTokenUseCase.ts
├── ports/           # Interfaces
│   ├── inbound/     # AuthService interface
│   └── outbound/    # TokenStore, IdentityProvider
└── adapters/        # Implementations
    ├── primary/     # Express middleware, NextAuth
    └── secondary/   # RedisStore, PostgresStore, JWKS
```

## License

MIT
