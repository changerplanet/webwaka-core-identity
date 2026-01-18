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
export class MockClerkAdapter implements ClerkAdapterInterface {
  private sessions: Map<string, ClerkSessionClaims> = new Map();
  private users: Map<string, ClerkUser> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private phoneIndex: Map<string, string> = new Map();
  private orgMembers: Map<string, Set<string>> = new Map();

  addSession(token: string, claims: ClerkSessionClaims): void {
    this.sessions.set(token, claims);
  }

  removeSession(token: string): void {
    this.sessions.delete(token);
  }

  addUser(user: ClerkUser): void {
    this.users.set(user.id, user);
    
    for (const email of user.emailAddresses) {
      this.emailIndex.set(email.emailAddress.toLowerCase(), user.id);
    }
    
    for (const phone of user.phoneNumbers) {
      this.phoneIndex.set(phone.phoneNumber, user.id);
    }
  }

  removeUser(userId: string): void {
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

  addOrgMember(orgId: string, userId: string): void {
    if (!this.orgMembers.has(orgId)) {
      this.orgMembers.set(orgId, new Set());
    }
    this.orgMembers.get(orgId)!.add(userId);
  }

  async verifySession(sessionToken: string): Promise<ClerkSessionClaims | null> {
    const claims = this.sessions.get(sessionToken);
    if (!claims) return null;
    
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) {
      this.sessions.delete(sessionToken);
      return null;
    }
    
    return claims;
  }

  async getUser(userId: string): Promise<ClerkUser | null> {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(email: string): Promise<ClerkUser | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async getUserByPhone(phone: string): Promise<ClerkUser | null> {
    const userId = this.phoneIndex.get(phone);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async listOrganizationMembers(orgId: string): Promise<ClerkUser[]> {
    const memberIds = this.orgMembers.get(orgId);
    if (!memberIds) return [];
    
    const members: ClerkUser[] = [];
    for (const userId of memberIds) {
      const user = this.users.get(userId);
      if (user) members.push(user);
    }
    return members;
  }

  clear(): void {
    this.sessions.clear();
    this.users.clear();
    this.emailIndex.clear();
    this.phoneIndex.clear();
    this.orgMembers.clear();
  }
}

/**
 * Convert Clerk user to UserProfile
 */
export function clerkUserToProfile(clerkUser: ClerkUser, tenantId: TenantId): UserProfile {
  const primaryEmail = clerkUser.emailAddresses.find(
    e => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;
  
  const primaryPhone = clerkUser.phoneNumbers.find(
    p => p.id === clerkUser.primaryPhoneNumberId
  )?.phoneNumber || clerkUser.phoneNumbers[0]?.phoneNumber || '';

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
export function extractTenantContext(claims: ClerkSessionClaims): ClerkTenantContext {
  const roles: RoleId[] = [];
  
  if (claims.org_role) {
    roles.push(claims.org_role);
  }
  
  const metadataRoles = (claims.metadata?.roles as string[]) || [];
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
