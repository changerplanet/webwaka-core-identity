# webwaka-core-identity

## Overview
This is a TypeScript library providing identity, authentication, and user management services. It is a core service module acting as a Clerk adapter/resolver. Authentication happens outside this module.

## Project Type
- **Type**: Node.js/TypeScript library
- **Language**: TypeScript
- **Package Manager**: npm
- **Identity Provider**: Clerk (adapter pattern)

## Features
- Identity resolution from session tokens (Clerk sessions)
- User management with strict tenant isolation
- Nigerian phone number normalization (E.164 format, +234)
- Provider-agnostic interface with Clerk adapter
- Pluggable storage backends

## Capabilities (as per manifest)
- `identity:resolve` - Resolve (tenantId, userId, roles) from session token
- `identity:get-user` - Get user by ID, phone, or email
- `identity:list-users` - List users in a tenant
- `identity:assert-tenant-context` - Assert and return tenant context

## Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run Jest tests (80 tests, 89%+ coverage)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

## Project Structure
```
src/
  ├── index.ts              # Main exports
  ├── identity-service.ts   # Core identity service implementation
  ├── clerk-adapter.ts      # Clerk adapter with mock support
  ├── types.ts              # TypeScript type definitions
  ├── storage.ts            # Storage backends (in-memory implementations)
  ├── validation.ts         # Input validation with Zod
  ├── phone-utils.ts        # Phone number normalization utilities
  └── *.test.ts             # Jest test files
```

## API Surface

### IdentityService
- `resolveIdentity(sessionToken)` - Resolve identity from session
- `getUser(tenantId, userId)` - Get user by ID
- `getUserByPhone(tenantId, phone)` - Get user by phone
- `getUserByEmail(tenantId, email)` - Get user by email  
- `listUsers(tenantId, options?)` - List users in tenant
- `assertTenantContext(sessionToken)` - Assert tenant context

### Clerk Adapter
- `MockClerkAdapter` - For testing with full control
- `clerkUserToProfile()` - Convert Clerk user to UserProfile
- `extractTenantContext()` - Extract context from Clerk claims

## Dependencies
- **zod**: Runtime validation
- **TypeScript**: Type system
- **Jest**: Testing framework
- **Dependency**: webwaka-core-registry

## Output
- Compiled JavaScript files go to `dist/`
- Main entry: `dist/index.js`
- Type definitions: `dist/index.d.ts`

## Recent Changes
- 2026-01-18: Implemented Clerk adapter with tenant isolation
- 2026-01-18: Added cross-tenant access prevention
- 2026-01-18: Added getUserByEmail, listUsers, assertTenantContext
- 2026-01-18: Updated module manifest with capabilities
