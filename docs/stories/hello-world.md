# Hello World Story

## Story

**As a** developer  
**I want to** verify JWT tokens  
**So that** I can protect my API endpoints

## Acceptance Criteria

- [ ] Can create a JoseJwtVerifier
- [ ] Can verify a valid JWT token
- [ ] Can handle expired tokens
- [ ] Can handle invalid signatures

## Implementation

```typescript
import { JoseJwtVerifier } from '@phenotype/auth-ts';

const verifier = new JoseJwtVerifier({
  jwksUrl: 'https://auth.example.com/.well-known/jwks.json',
  issuer: 'https://auth.example.com',
  audience: 'my-app',
});

// Verify a token
const claims = await verifier.verify(token);
console.log(claims.sub); // user identifier
```

## Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Hello World', () => {
  it('can verify a token', async () => {
    const verifier = new JoseJwtVerifier({ ... });
    const claims = await verifier.verify(validToken);
    expect(claims.sub).toBeDefined();
  });
});
```
