# Quick Start

Get up and running with phenotype-auth-ts in minutes.

## Basic Usage

### 1. Import the Package

```typescript
import { MemoryTokenStore, JoseJwtVerifier } from '@phenotype/auth-ts';
```

### 2. Create a Token Store

```typescript
const tokenStore = new MemoryTokenStore();
```

### 3. Create a JWT Verifier

```typescript
const verifier = new JoseJwtVerifier({
  jwksUrl: 'https://auth.example.com/.well-known/jwks.json',
  issuer: 'https://auth.example.com',
  audience: 'my-app',
});
```

### 4. Issue Tokens

```typescript
import { JwtTokenProvider } from '@phenotype/auth-ts';

const provider = new JwtTokenProvider({
  privateKey: process.env.PRIVATE_KEY!,
  issuer: 'https://auth.example.com',
  audience: 'my-app',
});

const response = await provider.requestToken({
  grantType: 'client_credentials',
  clientId: 'my-client',
  clientSecret: 'my-secret',
});
```

### 5. Verify Tokens

```typescript
const claims = await verifier.verify(token);
console.log(claims.sub); // user-id
```

## Next Steps

- [Core Workflow](../journeys/core-workflow)
- [API Reference](../reference/api)
