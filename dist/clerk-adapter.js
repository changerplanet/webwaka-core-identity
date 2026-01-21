"use strict";
/**
 * Clerk Adapter for Identity Resolution
 *
 * This module provides a provider-agnostic interface for Clerk integration.
 * Authentication happens outside this module - this is purely an adapter/resolver.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockClerkAdapter = void 0;
exports.clerkUserToProfile = clerkUserToProfile;
exports.extractTenantContext = extractTenantContext;
/**
 * Mock Clerk Adapter for testing
 *
 * This implementation allows full control over Clerk behavior in tests
 */
class MockClerkAdapter {
    constructor() {
        this.sessions = new Map();
        this.users = new Map();
        this.emailIndex = new Map();
        this.phoneIndex = new Map();
        this.orgMembers = new Map();
    }
    addSession(token, claims) {
        this.sessions.set(token, claims);
    }
    removeSession(token) {
        this.sessions.delete(token);
    }
    addUser(user) {
        this.users.set(user.id, user);
        for (const email of user.emailAddresses) {
            this.emailIndex.set(email.emailAddress.toLowerCase(), user.id);
        }
        for (const phone of user.phoneNumbers) {
            this.phoneIndex.set(phone.phoneNumber, user.id);
        }
    }
    removeUser(userId) {
        const user = this.users.get(userId);
        if (user) {
            for (const email of user.emailAddresses) {
                this.emailIndex.delete(email.emailAddress.toLowerCase());
            }
            for (const phone of user.phoneNumbers) {
                this.phoneIndex.delete(phone.phoneNumber);
            }
            this.users.delete(userId);
        }
    }
    addOrgMember(orgId, userId) {
        if (!this.orgMembers.has(orgId)) {
            this.orgMembers.set(orgId, new Set());
        }
        this.orgMembers.get(orgId).add(userId);
    }
    async verifySession(sessionToken) {
        const claims = this.sessions.get(sessionToken);
        if (!claims)
            return null;
        const now = Math.floor(Date.now() / 1000);
        if (claims.exp < now) {
            this.sessions.delete(sessionToken);
            return null;
        }
        return claims;
    }
    async getUser(userId) {
        return this.users.get(userId) || null;
    }
    async getUserByEmail(email) {
        const userId = this.emailIndex.get(email.toLowerCase());
        if (!userId)
            return null;
        return this.users.get(userId) || null;
    }
    async getUserByPhone(phone) {
        const userId = this.phoneIndex.get(phone);
        if (!userId)
            return null;
        return this.users.get(userId) || null;
    }
    async listOrganizationMembers(orgId) {
        const memberIds = this.orgMembers.get(orgId);
        if (!memberIds)
            return [];
        const members = [];
        for (const userId of memberIds) {
            const user = this.users.get(userId);
            if (user)
                members.push(user);
        }
        return members;
    }
    clear() {
        this.sessions.clear();
        this.users.clear();
        this.emailIndex.clear();
        this.phoneIndex.clear();
        this.orgMembers.clear();
    }
}
exports.MockClerkAdapter = MockClerkAdapter;
/**
 * Convert Clerk user to UserProfile
 */
function clerkUserToProfile(clerkUser, tenantId) {
    const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    const primaryPhone = clerkUser.phoneNumbers.find(p => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber || clerkUser.phoneNumbers[0]?.phoneNumber || '';
    return {
        userId: clerkUser.id,
        tenantId,
        phone: primaryPhone,
        email: primaryEmail,
        displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined,
        metadata: {
            ...clerkUser.publicMetadata,
            clerkId: clerkUser.id,
        },
        createdAt: new Date(clerkUser.createdAt),
        updatedAt: new Date(clerkUser.updatedAt),
    };
}
/**
 * Extract tenant context from Clerk session claims
 */
function extractTenantContext(claims) {
    const roles = [];
    if (claims.org_role) {
        roles.push(claims.org_role);
    }
    const metadataRoles = claims.metadata?.roles || [];
    roles.push(...metadataRoles);
    return {
        tenantId: claims.org_id || 'default',
        userId: claims.sub,
        roles,
        metadata: claims.metadata || {},
        sessionId: claims.sid,
        issuedAt: new Date(claims.iat * 1000),
        expiresAt: new Date(claims.exp * 1000),
    };
}
//# sourceMappingURL=clerk-adapter.js.map