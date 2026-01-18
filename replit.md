# webwaka-core-identity

## Overview
This is a TypeScript library providing identity, authentication, and user management services. It is a core service module, not a web application.

## Project Type
- **Type**: Node.js/TypeScript library
- **Language**: TypeScript
- **Package Manager**: npm

## Features
- Identity resolution from session tokens
- User management with tenant isolation
- Authentication primitives
- Session management
- Nigerian phone number normalization (E.164 format)
- Pluggable storage backends

## Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

## Project Structure
```
src/
  ├── index.ts              # Main exports
  ├── identity-service.ts   # Core identity service implementation
  ├── types.ts              # TypeScript type definitions
  ├── storage.ts            # Storage backends (in-memory implementations)
  ├── validation.ts         # Input validation with Zod
  ├── phone-utils.ts        # Phone number normalization utilities
  └── *.test.ts             # Jest test files
```

## Dependencies
- **zod**: Runtime validation
- **TypeScript**: Type system
- **Jest**: Testing framework

## Output
- Compiled JavaScript files go to `dist/`
- Main entry: `dist/index.js`
- Type definitions: `dist/index.d.ts`
