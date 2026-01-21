/**
 * Clerk Adapter for Identity Resolution
 *
 * This module provides a provider-agnostic interface for Clerk integration.
 * Authentication happens outside this module - this is purely an adapter/resolver.
 */
import { TenantId, UserId, RoleId, UserProfile } from './types';
/**
 * Clerk session claims structure
 */
export interface ClerkSessionClaims {
    sub: string;
    sid: string;
    org_id?: string;
    org_role?: string;
    org_slug?: string;
    metadata?: Record<string, unknown>;
    iat: number;
    exp: number;
}
/**
 * Clerk user data structure
 */
export interface ClerkUser {
    id: string;
    primaryEmailAddressId?: string;
    primaryPhoneNumberId?: string;
    emailAddresses: Array<{
        id: string;
        emailAddress: string;
    }>;
    phoneNumbers: Array<{
        id: string;
        phoneNumber: string;
    }>;
    firstName?: string;
    lastName?: string;
    publicMetadata: Record<string, unknown>;
    privateMetadata: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
/**
 * Clerk adapter interface - allows mocking in tests
 */
export interface ClerkAdapterInterface {
    verifySession(sessionToken: string): Promise<ClerkSessionClaims | null>;
    getUser(userId: string): Promise<ClerkUser | null>;
    getUserByEmail(email: string): Promise<ClerkUser | null>;
    getUserByPhone(phone: string): Promise<ClerkUser | null>;
    listOrganizationMembers(orgId: string): Promise<ClerkUser[]>;
}
/**
 * Session token verification result
 */
export interface ClerkSessionVerification {
    valid: boolean;
    claims?: ClerkSessionClaims;
    error?: string;
}
/**
 * Tenant context extracted from Clerk session
 */
export interface ClerkTenantContext {
    tenantId: TenantId;
    userId: UserId;
    roles: RoleId[];
    metadata: Record<string, unknown>;
    sessionId: string;
    issuedAt: Date;
    expiresAt: Date;
}
/**
 * Mock Clerk Adapter for testing
 *
 * This implementation allows full control over Clerk behavior in tests
 */
export declare class MockClerkAdapter implements ClerkAdapterInterface {
    private sessions;
    private users;
    private emailIndex;
    private phoneIndex;
    private orgMembers;
    addSession(token: string, claims: ClerkSessionClaims): void;
    removeSession(token: string): void;
    addUser(user: ClerkUser): void;
    removeUser(userId: string): void;
    addOrgMember(orgId: string, userId: string): void;
    verifySession(sessionToken: string): Promise<ClerkSessionClaims | null>;
    getUser(userId: string): Promise<ClerkUser | null>;
    getUserByEmail(email: string): Promise<ClerkUser | null>;
    getUserByPhone(phone: string): Promise<ClerkUser | null>;
    listOrganizationMembers(orgId: string): Promise<ClerkUser[]>;
    clear(): void;
}
/**
 * Convert Clerk user to UserProfile
 */
export declare function clerkUserToProfile(clerkUser: ClerkUser, tenantId: TenantId): UserProfile;
/**
 * Extract tenant context from Clerk session claims
 */
export declare function extractTenantContext(claims: ClerkSessionClaims): ClerkTenantContext;
//# sourceMappingURL=clerk-adapter.d.ts.map