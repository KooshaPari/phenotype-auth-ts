# API Reference

## Classes

### JoseJwtVerifier

JWT token verification using jose library.

```typescript
import { JoseJwtVerifier } from '@phenotype/auth-ts';

const verifier = new JoseJwtVerifier({
  jwksUrl: 'https://auth.example.com/.well-known/jwks.json',
  issuer: 'https://auth.example.com',
  audience: 'my-app',
});
```

#### Methods

- `verify(token: string): Promise<JwtClaims>` - Verify and decode JWT
- `validateClaims(claims: JwtClaims, options: ClaimsValidationOptions): Promise<boolean>` - Validate specific claims

### JwtTokenProvider

Token issuance using jose library.

```typescript
import { JwtTokenProvider } from '@phenotype/auth-ts';

const provider = new JwtTokenProvider({
  privateKey: process.env.PRIVATE_KEY!,
  issuer: 'https://auth.example.com',
  audience: 'my-app',
});
```

#### Methods

- `requestToken(req: TokenRequest): Promise<TokenResponse>` - Issue token based on grant type
- `refreshToken(refreshToken: string): Promise<TokenResponse>` - Refresh access token

### MemoryTokenStore

In-memory token storage adapter.

```typescript
import { MemoryTokenStore } from '@phenotype/auth-ts';

const store = new MemoryTokenStore();
```

#### Methods

- `save(key: string, token: Token, ttl: number): Promise<void>` - Store token
- `get(key: string): Promise<Token | null>` - Retrieve token
- `delete(key: string): Promise<void>` - Remove token

### createAuthMiddleware

Express middleware for bearer token authentication.

```typescript
import { createAuthMiddleware } from '@phenotype/auth-ts';

app.use(createAuthMiddleware({ verifier }));
```

## Types

See `src/domain/` and `src/ports/` for full type definitions.
