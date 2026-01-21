/**
 * WebWaka Core Identity Service
 *
 * Provides canonical identity resolution, user profiles, authentication primitives,
 * and tenant-aware session context for the WebWaka platform.
 *
 * Uses Clerk as the Identity Provider - this module is a Clerk adapter + resolver.
 * Authentication happens outside this module.
 */
export { IdentityService, IdentityServiceConfig } from './identity-service';
export { TenantId, UserId, RoleId, SessionId, NigerianPhone, UserProfile, AuthResult, SessionContext, IdentityResolution, CreateUserInput, UpdateUserInput, AuthenticateInput, SessionValidation, TenantContext, } from './types';
export { UserStorage, SessionStorage, InMemoryUserStorage, InMemorySessionStorage, } from './storage';
export { ClerkAdapterInterface, ClerkSessionClaims, ClerkUser, ClerkSessionVerification, ClerkTenantContext, MockClerkAdapter, clerkUserToProfile, extractTenantContext, } from './clerk-adapter';
export { normalizeNigerianPhone, isValidNigerianPhone, formatNigerianPhone, } from './phone-utils';
export { validate, TenantIdSchema, UserIdSchema, RoleIdSchema, SessionIdSchema, NigerianPhoneSchema, EmailSchema, DisplayNameSchema, MetadataSchema, CreateUserInputSchema, UpdateUserInputSchema, AuthenticateInputSchema, } from './validation';
//# sourceMappingURL=index.d.ts.map