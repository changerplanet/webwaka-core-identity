/**
 * Storage interface for identity data
 *
 * This is an abstraction layer that allows the identity service to be
 * storage-agnostic. Implementations can use any database or storage backend.
 */
import { TenantId, UserId, SessionId, UserProfile, SessionContext } from './types';
/**
 * Storage interface for user profiles
 */
export interface UserStorage {
    /**
     * Create a new user profile
     */
    createUser(profile: UserProfile): Promise<UserProfile>;
    /**
     * Get a user profile by ID
     */
    getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null>;
    /**
     * Get a user profile by phone number
     */
    getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null>;
    /**
     * Get a user profile by email
     */
    getUserByEmail(tenantId: TenantId, email: string): Promise<UserProfile | null>;
    /**
     * Update a user profile
     */
    updateUser(tenantId: TenantId, userId: UserId, updates: Partial<UserProfile>): Promise<UserProfile>;
    /**
     * Delete a user profile
     */
    deleteUser(tenantId: TenantId, userId: UserId): Promise<void>;
    /**
     * List users in a tenant (with pagination)
     */
    listUsers(tenantId: TenantId, limit: number, offset: number): Promise<UserProfile[]>;
}
/**
 * Storage interface for sessions
 */
export interface SessionStorage {
    /**
     * Create a new session
     */
    createSession(context: SessionContext): Promise<SessionContext>;
    /**
     * Get a session by ID
     */
    getSession(sessionId: SessionId): Promise<SessionContext | null>;
    /**
     * Delete a session (logout)
     */
    deleteSession(sessionId: SessionId): Promise<void>;
    /**
     * Delete all sessions for a user
     */
    deleteUserSessions(tenantId: TenantId, userId: UserId): Promise<void>;
}
/**
 * In-memory implementation for testing and development
 */
export declare class InMemoryUserStorage implements UserStorage {
    private users;
    private getKey;
    private getPhoneKey;
    private getEmailKey;
    createUser(profile: UserProfile): Promise<UserProfile>;
    getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null>;
    getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null>;
    getUserByEmail(tenantId: TenantId, email: string): Promise<UserProfile | null>;
    updateUser(tenantId: TenantId, userId: UserId, updates: Partial<UserProfile>): Promise<UserProfile>;
    deleteUser(tenantId: TenantId, userId: UserId): Promise<void>;
    listUsers(tenantId: TenantId, limit: number, offset: number): Promise<UserProfile[]>;
}
/**
 * In-memory implementation for sessions
 */
export declare class InMemorySessionStorage implements SessionStorage {
    private sessions;
    createSession(context: SessionContext): Promise<SessionContext>;
    getSession(sessionId: SessionId): Promise<SessionContext | null>;
    deleteSession(sessionId: SessionId): Promise<void>;
    deleteUserSessions(tenantId: TenantId, userId: UserId): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map