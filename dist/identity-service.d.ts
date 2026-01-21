/**
 * Core Identity Service
 *
 * Provides canonical identity resolution, user profiles, authentication primitives,
 * and tenant-aware session context. Acts as a Clerk adapter/resolver.
 */
import { TenantId, UserId, SessionId, RoleId, UserProfile, IdentityResolution, CreateUserInput, UpdateUserInput, AuthenticateInput, AuthResult, SessionValidation, TenantContext } from './types';
import { UserStorage, SessionStorage } from './storage';
import { ClerkAdapterInterface } from './clerk-adapter';
/**
 * Identity service configuration
 */
export interface IdentityServiceConfig {
    userStorage: UserStorage;
    sessionStorage: SessionStorage;
    sessionDurationMs?: number;
    clerkAdapter?: ClerkAdapterInterface;
}
/**
 * Identity Service
 *
 * Provider-agnostic identity service with Clerk adapter support.
 * Can operate in two modes:
 * 1. Standalone mode - uses local storage for sessions
 * 2. Clerk mode - uses Clerk for session verification and user data
 */
export declare class IdentityService {
    private userStorage;
    private sessionStorage;
    private sessionDurationMs;
    private clerkAdapter?;
    constructor(config: IdentityServiceConfig);
    /**
     * Create a new user
     */
    createUser(input: CreateUserInput): Promise<UserProfile>;
    /**
     * Get user by ID
     *
     * In Clerk mode, verifies the user is a member of the specified tenant
     * to enforce strict tenant isolation.
     */
    getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null>;
    /**
     * Get user by phone number
     *
     * In Clerk mode, verifies the user is a member of the specified tenant
     * to enforce strict tenant isolation.
     */
    getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null>;
    /**
     * Get user by email
     *
     * In Clerk mode, verifies the user is a member of the specified tenant
     * to enforce strict tenant isolation.
     */
    getUserByEmail(tenantId: TenantId, email: string): Promise<UserProfile | null>;
    /**
     * Check if a user is a member of a tenant (Clerk organization)
     */
    private isUserInTenant;
    /**
     * List users in a tenant
     */
    listUsers(tenantId: TenantId, options?: {
        limit?: number;
        offset?: number;
    }): Promise<UserProfile[]>;
    /**
     * Update user profile
     */
    updateUser(tenantId: TenantId, userId: UserId, input: UpdateUserInput): Promise<UserProfile>;
    /**
     * Delete user
     */
    deleteUser(tenantId: TenantId, userId: UserId): Promise<void>;
    /**
     * Authenticate a user
     *
     * Note: In Clerk mode, authentication happens outside this module.
     * This method is for standalone mode only.
     */
    authenticate(input: AuthenticateInput, roles?: RoleId[]): Promise<AuthResult>;
    /**
     * Validate a session
     */
    validateSession(sessionId: SessionId): Promise<SessionValidation>;
    /**
     * Resolve identity from session token
     *
     * HARD STOP REQUIREMENT: A Suite can provide a session token and reliably receive
     * (tenantId, userId, roles, identity metadata)
     */
    resolveIdentity(sessionToken: SessionId): Promise<IdentityResolution>;
    /**
     * Assert tenant context from session token
     *
     * Validates session and returns tenant context, throwing if invalid.
     * Use this to enforce tenant isolation in downstream services.
     */
    assertTenantContext(sessionToken: SessionId): Promise<TenantContext>;
    /**
     * Logout (delete session)
     */
    logout(sessionId: SessionId): Promise<void>;
    /**
     * Logout all sessions for a user
     */
    logoutAll(tenantId: TenantId, userId: UserId): Promise<void>;
    private generateId;
}
//# sourceMappingURL=identity-service.d.ts.map