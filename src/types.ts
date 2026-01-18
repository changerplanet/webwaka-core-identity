/**
 * Core type definitions for the Identity service
 */

/**
 * Tenant identifier - enforces tenant isolation
 */
export type TenantId = string;

/**
 * User identifier - unique within a tenant
 */
export type UserId = string;

/**
 * Role identifier
 */
export type RoleId = string;

/**
 * Session identifier
 */
export type SessionId = string;

/**
 * Nigerian phone number in E.164 format (+234...)
 */
export type NigerianPhone = string;

/**
 * User profile data
 */
export interface UserProfile {
  userId: UserId;
  tenantId: TenantId;
  phone: NigerianPhone;
  email?: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication result
 */
export interface AuthResult {
  userId: UserId;
  tenantId: TenantId;
  sessionId: SessionId;
  roles: RoleId[];
  expiresAt: Date;
}

/**
 * Session context - tenant-aware
 */
export interface SessionContext {
  sessionId: SessionId;
  userId: UserId;
  tenantId: TenantId;
  roles: RoleId[];
  issuedAt: Date;
  expiresAt: Date;
}

/**
 * Identity resolution result
 */
export interface IdentityResolution {
  userId: UserId;
  tenantId: TenantId;
  roles: RoleId[];
  profile: UserProfile;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  tenantId: TenantId;
  phone: NigerianPhone;
  email?: string;
  displayName?: string;
  roles?: RoleId[];
  metadata?: Record<string, unknown>;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  email?: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Authentication input
 */
export interface AuthenticateInput {
  tenantId: TenantId;
  phone: NigerianPhone;
  credential: string;
}

/**
 * Session validation result
 */
export interface SessionValidation {
  valid: boolean;
  context?: SessionContext;
  reason?: string;
}
