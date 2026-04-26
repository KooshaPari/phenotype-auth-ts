# phenotype-auth-ts

[![Release](https://img.shields.io/github/v/release/KooshaPari/phenotype-auth-ts?include_prereleases&sort=semver)](https://github.com/KooshaPari/phenotype-auth-ts/releases)
[![License](https://img.shields.io/github/license/KooshaPari/phenotype-auth-ts)](LICENSE)
[![Phenotype](https://img.shields.io/badge/Phenotype-org-blueviolet)](https://github.com/KooshaPari)


TypeScript **OAuth2 / OIDC** authentication patterns using **hexagonal** layout: domain types, ports, and swappable adapters (memory token store, JWT provider).

## Layout

| Area | Role |
|------|------|
| `domain/` | Token types, claims, errors |
| `ports/` | `TokenProvider`, `TokenStore`, `TokenVerifier` |
| `adapters/` | `MemoryTokenStore`, `PlaceholderJwtVerifier` (swap for real JWKS/JWT lib in production) |

## Architecture

See `adr/ADR-001-architecture.md`.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
