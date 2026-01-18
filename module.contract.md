# Module Contract: Core Identity

## Purpose

The Core Identity service provides canonical identity resolution, user profile management, authentication primitives, and tenant-aware session context for the WebWaka platform. It serves as the foundational identity layer that all other services depend on.

## Capabilities

This module provides the following capabilities:

- **Identity Resolution**: Resolve user identity from session tokens to obtain (tenant_id, user_id, roles)
- **User Management**: Create, read, update, and delete user profiles with tenant isolation
- **Authentication**: Authenticate users and create sessions (auth provider agnostic)
- **Session Management**: Validate sessions, manage session lifecycle, and enforce expiration
- **Tenant Isolation**: Enforce strict tenant boundaries in all operations
- **Nigerian Phone Normalization**: Normalize Nigerian phone numbers to E.164 format

## Dependencies

This module has no dependencies on other WebWaka modules. It is a foundational core service.

## API Surface

### Public Interfaces

#### IdentityService

The main service class that provides all identity operations.

```typescript
class IdentityService {
  constructor(config: IdentityServiceConfig);
  
  // User management
  createUser(input: CreateUserInput): Promise<UserProfile>;
  getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null>;
  getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null>;
  updateUser(tenantId: TenantId, userId: UserId, input: UpdateUserInput): Promise<UserProfile>;
  deleteUser(tenantId: TenantId, userId: UserId): Promise<void>;
  
  // Authentication
  authenticate(input: AuthenticateInput, roles?: RoleId[]): Promise<AuthResult>;
  
  // Session management
  validateSession(sessionId: SessionId): Promise<SessionValidation>;
  resolveIdentity(sessionId: SessionId): Promise<IdentityResolution>;
  logout(sessionId: SessionId): Promise<void>;
  logoutAll(tenantId: TenantId, userId: UserId): Promise<void>;
}
```

#### Storage Interfaces

Storage abstraction for pluggable persistence backends.

```typescript
interface UserStorage {
  createUser(profile: UserProfile): Promise<UserProfile>;
  getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null>;
  getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null>;
  updateUser(tenantId: TenantId, userId: UserId, updates: Partial<UserProfile>): Promise<UserProfile>;
  deleteUser(tenantId: TenantId, userId: UserId): Promise<void>;
  listUsers(tenantId: TenantId, limit: number, offset: number): Promise<UserProfile[]>;
}

interface SessionStorage {
  createSession(context: SessionContext): Promise<SessionContext>;
  getSession(sessionId: SessionId): Promise<SessionContext | null>;
  deleteSession(sessionId: SessionId): Promise<void>;
  deleteUserSessions(tenantId: TenantId, userId: UserId): Promise<void>;
}
```

#### Utility Functions

```typescript
// Nigerian phone normalization
function normalizeNigerianPhone(input: string): NigerianPhone;
function isValidNigerianPhone(input: string): boolean;
function formatNigerianPhone(phone: NigerianPhone): string;

// Input validation
function validate<T>(schema: ZodSchema<T>, input: unknown): T;
```

### Events

This module does not emit events. It is a synchronous service that returns results directly.

## Data Models

### UserProfile

```typescript
interface UserProfile {
  userId: UserId;
  tenantId: TenantId;
  phone: NigerianPhone;        // E.164 format (+234...)
  email?: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

### SessionContext

```typescript
interface SessionContext {
  sessionId: SessionId;
  userId: UserId;
  tenantId: TenantId;
  roles: RoleId[];
  issuedAt: Date;
  expiresAt: Date;
}
```

### IdentityResolution

```typescript
interface IdentityResolution {
  userId: UserId;
  tenantId: TenantId;
  roles: RoleId[];
  profile: UserProfile;
}
```

## Security Considerations

### Tenant Isolation

**All operations enforce strict tenant isolation.** A user in tenant A cannot access data from tenant B. The `tenantId` is a required parameter for all user-facing operations.

### Authentication Abstraction

The authentication mechanism is intentionally abstract to avoid lock-in to any specific auth provider. The `authenticate()` method accepts a `credential` parameter but does not specify its format. Implementers should integrate with their chosen auth provider (OAuth, SAML, custom, etc.).

### Session Security

- Sessions are identified by cryptographically random session IDs (128-bit)
- Sessions have configurable expiration times (default: 24 hours)
- Expired sessions are automatically invalidated
- Sessions can be revoked individually or in bulk per user

### Phone Number Privacy

Phone numbers are stored in normalized E.164 format and should be treated as sensitive PII. Access to phone numbers should be restricted and logged.

## Performance Expectations

### Storage Abstraction

The service uses a storage abstraction layer to allow for different persistence backends. The in-memory implementation is provided for testing and development. Production deployments should use a persistent storage backend (e.g., PostgreSQL, MySQL, DynamoDB).

### Expected Latency

- User creation: < 100ms
- User lookup: < 50ms
- Session validation: < 10ms (with caching)
- Identity resolution: < 100ms

### Scalability

The service is stateless and horizontally scalable. Session storage should be shared across instances (e.g., Redis, database).

## Versioning

This module follows semantic versioning (semver).

**Current version:** 0.1.0 (initial implementation)

### Breaking Changes

Breaking changes will increment the major version. Examples of breaking changes:
- Removing or renaming public interfaces
- Changing function signatures
- Modifying data model structure
- Changing validation rules

### Non-Breaking Changes

Non-breaking changes will increment the minor or patch version. Examples:
- Adding new optional parameters
- Adding new methods
- Performance improvements
- Bug fixes
