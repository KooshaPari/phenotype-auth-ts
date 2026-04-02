# Quick Start Journey

This journey gets you from zero to authenticated in 5 minutes.

## Steps

### Step 1: Install

```bash
npm install @phenotype/auth-ts
```

### Step 2: Create a Verifier

```typescript
import { JoseJwtVerifier } from '@phenotype/auth-ts';

const verifier = new JoseJwtVerifier({
  jwksUrl: 'https://your-auth-server/.well-known/jwks.json',
  issuer: 'https://your-auth-server',
  audience: 'your-app',
});
```

### Step 3: Verify a Token

```typescript
const claims = await verifier.verify(token);
console.log(`User: ${claims.sub}`);
```

### Step 4: Add Middleware (Optional)

```typescript
import { createAuthMiddleware } from '@phenotype/auth-ts';

app.use(createAuthMiddleware({ verifier }));
```

## Next

- [Core Workflow](./core-workflow)
