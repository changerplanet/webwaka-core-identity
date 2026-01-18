/**
 * Core Identity Service
 * 
 * Provides canonical identity resolution, user profiles, authentication primitives,
 * and tenant-aware session context. Acts as a Clerk adapter/resolver.
 */

import { randomBytes } from 'crypto';
import {
  TenantId,
  UserId,
  SessionId,
  RoleId,
  UserProfile,
  SessionContext,
  IdentityResolution,
  CreateUserInput,
  UpdateUserInput,
  AuthenticateInput,
  AuthResult,
  SessionValidation,
  TenantContext,
} from './types';
import { normalizeNigerianPhone } from './phone-utils';
import {
  validate,
  CreateUserInputSchema,
  UpdateUserInputSchema,
  AuthenticateInputSchema,
  TenantIdSchema,
  UserIdSchema,
  SessionIdSchema,
  EmailSchema,
} from './validation';
import { UserStorage, SessionStorage } from './storage';
import {
  ClerkAdapterInterface,
  extractTenantContext,
  clerkUserToProfile,
} from './clerk-adapter';

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
export class IdentityService {
  private userStorage: UserStorage;
  private sessionStorage: SessionStorage;
  private sessionDurationMs: number;
  private clerkAdapter?: ClerkAdapterInterface;

  constructor(config: IdentityServiceConfig) {
    this.userStorage = config.userStorage;
    this.sessionStorage = config.sessionStorage;
    this.sessionDurationMs = config.sessionDurationMs || 24 * 60 * 60 * 1000;
    this.clerkAdapter = config.clerkAdapter;
  }

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<UserProfile> {
    const validated = validate(CreateUserInputSchema, input);
    const normalizedPhone = normalizeNigerianPhone(validated.phone);

    const existing = await this.userStorage.getUserByPhone(validated.tenantId, normalizedPhone);
    if (existing) {
      throw new Error(`User with phone ${normalizedPhone} already exists in tenant ${validated.tenantId}`);
    }

    const userId = this.generateId();
    const profile: UserProfile = {
      userId,
      tenantId: validated.tenantId,
      phone: normalizedPhone,
      email: validated.email,
      displayName: validated.displayName,
      metadata: validated.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.userStorage.createUser(profile);
  }

  /**
   * Get user by ID
   * 
   * In Clerk mode, verifies the user is a member of the specified tenant
   * to enforce strict tenant isolation.
   */
  async getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);

    if (this.clerkAdapter) {
      const isMember = await this.isUserInTenant(tenantId, userId);
      if (!isMember) return null;
      
      const clerkUser = await this.clerkAdapter.getUser(userId);
      if (!clerkUser) return null;
      return clerkUserToProfile(clerkUser, tenantId);
    }

    return this.userStorage.getUser(tenantId, userId);
  }

  /**
   * Get user by phone number
   * 
   * In Clerk mode, verifies the user is a member of the specified tenant
   * to enforce strict tenant isolation.
   */
  async getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null> {
    validate(TenantIdSchema, tenantId);
    const normalizedPhone = normalizeNigerianPhone(phone);

    if (this.clerkAdapter) {
      const clerkUser = await this.clerkAdapter.getUserByPhone(normalizedPhone);
      if (!clerkUser) return null;
      
      const isMember = await this.isUserInTenant(tenantId, clerkUser.id);
      if (!isMember) return null;
      
      return clerkUserToProfile(clerkUser, tenantId);
    }

    return this.userStorage.getUserByPhone(tenantId, normalizedPhone);
  }

  /**
   * Get user by email
   * 
   * In Clerk mode, verifies the user is a member of the specified tenant
   * to enforce strict tenant isolation.
   */
  async getUserByEmail(tenantId: TenantId, email: string): Promise<UserProfile | null> {
    validate(TenantIdSchema, tenantId);
    validate(EmailSchema, email);

    if (this.clerkAdapter) {
      const clerkUser = await this.clerkAdapter.getUserByEmail(email);
      if (!clerkUser) return null;
      
      const isMember = await this.isUserInTenant(tenantId, clerkUser.id);
      if (!isMember) return null;
      
      return clerkUserToProfile(clerkUser, tenantId);
    }

    return this.userStorage.getUserByEmail(tenantId, email);
  }

  /**
   * Check if a user is a member of a tenant (Clerk organization)
   */
  private async isUserInTenant(tenantId: TenantId, userId: UserId): Promise<boolean> {
    if (!this.clerkAdapter) return false;
    
    const members = await this.clerkAdapter.listOrganizationMembers(tenantId);
    return members.some(member => member.id === userId);
  }

  /**
   * List users in a tenant
   */
  async listUsers(tenantId: TenantId, options?: { limit?: number; offset?: number }): Promise<UserProfile[]> {
    validate(TenantIdSchema, tenantId);
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    if (this.clerkAdapter) {
      const clerkUsers = await this.clerkAdapter.listOrganizationMembers(tenantId);
      return clerkUsers
        .slice(offset, offset + limit)
        .map(u => clerkUserToProfile(u, tenantId));
    }

    return this.userStorage.listUsers(tenantId, limit, offset);
  }

  /**
   * Update user profile
   */
  async updateUser(tenantId: TenantId, userId: UserId, input: UpdateUserInput): Promise<UserProfile> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);
    const validated = validate(UpdateUserInputSchema, input);

    return this.userStorage.updateUser(tenantId, userId, {
      ...validated,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete user
   */
  async deleteUser(tenantId: TenantId, userId: UserId): Promise<void> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);

    await this.sessionStorage.deleteUserSessions(tenantId, userId);
    await this.userStorage.deleteUser(tenantId, userId);
  }

  /**
   * Authenticate a user
   * 
   * Note: In Clerk mode, authentication happens outside this module.
   * This method is for standalone mode only.
   */
  async authenticate(input: AuthenticateInput, roles: RoleId[] = []): Promise<AuthResult> {
    const validated = validate(AuthenticateInputSchema, input);
    const normalizedPhone = normalizeNigerianPhone(validated.phone);

    const user = await this.userStorage.getUserByPhone(validated.tenantId, normalizedPhone);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const sessionId = this.generateId();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + this.sessionDurationMs);

    const sessionContext: SessionContext = {
      sessionId,
      userId: user.userId,
      tenantId: user.tenantId,
      roles,
      issuedAt,
      expiresAt,
    };

    await this.sessionStorage.createSession(sessionContext);

    return {
      userId: user.userId,
      tenantId: user.tenantId,
      sessionId,
      roles,
      expiresAt,
    };
  }

  /**
   * Validate a session
   */
  async validateSession(sessionId: SessionId): Promise<SessionValidation> {
    validate(SessionIdSchema, sessionId);

    if (this.clerkAdapter) {
      const claims = await this.clerkAdapter.verifySession(sessionId);
      if (!claims) {
        return { valid: false, reason: 'Invalid or expired session' };
      }

      const tenantContext = extractTenantContext(claims);
      return {
        valid: true,
        context: {
          sessionId: tenantContext.sessionId,
          userId: tenantContext.userId,
          tenantId: tenantContext.tenantId,
          roles: tenantContext.roles,
          issuedAt: tenantContext.issuedAt,
          expiresAt: tenantContext.expiresAt,
        },
      };
    }

    const context = await this.sessionStorage.getSession(sessionId);
    if (!context) {
      return { valid: false, reason: 'Session not found' };
    }

    if (context.expiresAt < new Date()) {
      await this.sessionStorage.deleteSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    return { valid: true, context };
  }

  /**
   * Resolve identity from session token
   * 
   * HARD STOP REQUIREMENT: A Suite can provide a session token and reliably receive
   * (tenantId, userId, roles, identity metadata)
   */
  async resolveIdentity(sessionToken: SessionId): Promise<IdentityResolution> {
    const validation = await this.validateSession(sessionToken);
    if (!validation.valid || !validation.context) {
      throw new Error(`Invalid session: ${validation.reason}`);
    }

    const profile = await this.getUser(
      validation.context.tenantId,
      validation.context.userId
    );

    if (!profile) {
      throw new Error('User not found');
    }

    return {
      userId: profile.userId,
      tenantId: profile.tenantId,
      roles: validation.context.roles,
      profile,
    };
  }

  /**
   * Assert tenant context from session token
   * 
   * Validates session and returns tenant context, throwing if invalid.
   * Use this to enforce tenant isolation in downstream services.
   */
  async assertTenantContext(sessionToken: SessionId): Promise<TenantContext> {
    const validation = await this.validateSession(sessionToken);
    if (!validation.valid || !validation.context) {
      throw new Error(`Unauthorized: ${validation.reason || 'Invalid session'}`);
    }

    return {
      tenantId: validation.context.tenantId,
      userId: validation.context.userId,
      roles: validation.context.roles,
      sessionId: validation.context.sessionId,
    };
  }

  /**
   * Logout (delete session)
   */
  async logout(sessionId: SessionId): Promise<void> {
    validate(SessionIdSchema, sessionId);
    await this.sessionStorage.deleteSession(sessionId);
  }

  /**
   * Logout all sessions for a user
   */
  async logoutAll(tenantId: TenantId, userId: UserId): Promise<void> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);
    await this.sessionStorage.deleteUserSessions(tenantId, userId);
  }

  private generateId(): string {
    return randomBytes(16).toString('hex');
  }
}
