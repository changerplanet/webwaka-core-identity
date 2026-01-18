# webwaka-core-identity

**Type:** core  
**Description:** Identity, authentication, and user management core service

## Status

✅ **Phase 2.1 Complete** - Core identity service implemented and tested.

This module provides production-grade identity resolution, user management, authentication, and session management with strict tenant isolation.

## Features

- **Identity Resolution**: Resolve (tenant_id, user_id, roles) from session tokens
- **User Management**: CRUD operations for user profiles with tenant isolation
- **Authentication**: Provider-agnostic authentication primitives
- **Session Management**: Secure session creation, validation, and lifecycle management
- **Nigerian Phone Normalization**: Automatic normalization to E.164 format
- **Storage Abstraction**: Pluggable storage backends for flexibility

## Installation

```bash
pnpm install
```

## Usage

```typescript
import { IdentityService, InMemoryUserStorage, InMemorySessionStorage } from 'webwaka-core-identity';

// Create service instance
const identityService = new IdentityService({
  userStorage: new InMemoryUserStorage(),
  sessionStorage: new InMemorySessionStorage(),
});

// Create a user
const user = await identityService.createUser({
  tenantId: 'tenant-1',
  phone: '08012345678',  // Auto-normalized to +2348012345678
  displayName: 'John Doe',
});

// Authenticate
const authResult = await identityService.authenticate({
  tenantId: 'tenant-1',
  phone: '08012345678',
  credential: 'password123',
}, ['user']);

// Resolve identity from session
const identity = await identityService.resolveIdentity(authResult.sessionId);
console.log(identity.userId, identity.tenantId, identity.roles);
```

## Testing

```bash
pnpm test
```

## Documentation

- [Module Contract](./module.contract.md) - Defines the module's capabilities, dependencies, and API surface
- [Changelog](./CHANGELOG.md) - Version history and changes
- [Security Policy](./SECURITY.md) - Security guidelines and vulnerability reporting
- [Owners](./OWNERS.md) - Maintainers and code review requirements

## Module Manifest

See `module.manifest.json` for the complete module specification.

## Contributing

This module follows the WebWaka architectural rules:
- All changes must go through pull requests
- CI/CD checks must pass before merging
- Manifest validation is enforced automatically

## License

MIT
