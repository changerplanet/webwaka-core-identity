/**
 * Core Identity Service
 * 
 * Provides canonical identity resolution, user profiles, authentication primitives,
 * and tenant-aware session context.
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
} from './validation';
import { UserStorage, SessionStorage } from './storage';

/**
 * Identity service configuration
 */
export interface IdentityServiceConfig {
  userStorage: UserStorage;
  sessionStorage: SessionStorage;
  sessionDurationMs?: number; // Default: 24 hours
}

/**
 * Identity Service
 */
export class IdentityService {
  private userStorage: UserStorage;
  private sessionStorage: SessionStorage;
  private sessionDurationMs: number;

  constructor(config: IdentityServiceConfig) {
    this.userStorage = config.userStorage;
    this.sessionStorage = config.sessionStorage;
    this.sessionDurationMs = config.sessionDurationMs || 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<UserProfile> {
    // Validate input
    const validated = validate(CreateUserInputSchema, input);

    // Normalize phone number
    const normalizedPhone = normalizeNigerianPhone(validated.phone);

    // Check if user already exists
    const existing = await this.userStorage.getUserByPhone(validated.tenantId, normalizedPhone);
    if (existing) {
      throw new Error(`User with phone ${normalizedPhone} already exists in tenant ${validated.tenantId}`);
    }

    // Generate user ID
    const userId = this.generateId();

    // Create user profile
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
   */
  async getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null> {
    validate(TenantIdSchema, tenantId);
    validate(UserIdSchema, userId);
    return this.userStorage.getUser(tenantId, userId);
  }

  /**
   * Get user by phone number
   */
  async getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null> {
    validate(TenantIdSchema, tenantId);
    const normalizedPhone = normalizeNigerianPhone(phone);
    return this.userStorage.getUserByPhone(tenantId, normalizedPhone);
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

    // Delete all sessions for this user
    await this.sessionStorage.deleteUserSessions(tenantId, userId);

    // Delete user profile
    await this.userStorage.deleteUser(tenantId, userId);
  }

  /**
   * Authenticate a user
   * 
   * Note: This is a primitive authentication method. In production, this should
   * integrate with a proper authentication provider (e.g., OAuth, SAML, etc.)
   * The credential validation is intentionally left abstract to avoid lock-in.
   */
  async authenticate(input: AuthenticateInput, roles: RoleId[] = []): Promise<AuthResult> {
    const validated = validate(AuthenticateInputSchema, input);

    // Normalize phone number
    const normalizedPhone = normalizeNigerianPhone(validated.phone);

    // Get user by phone
    const user = await this.userStorage.getUserByPhone(validated.tenantId, normalizedPhone);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Credential validation would happen here
    // For now, we assume the credential is valid if the user exists
    // In production, this should call an external auth provider

    // Create session
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

    const context = await this.sessionStorage.getSession(sessionId);
    if (!context) {
      return { valid: false, reason: 'Session not found' };
    }

    // Check if session has expired
    if (context.expiresAt < new Date()) {
      await this.sessionStorage.deleteSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    return { valid: true, context };
  }

  /**
   * Resolve identity from session
   */
  async resolveIdentity(sessionId: SessionId): Promise<IdentityResolution> {
    const validation = await this.validateSession(sessionId);
    if (!validation.valid || !validation.context) {
      throw new Error(`Invalid session: ${validation.reason}`);
    }

    const profile = await this.userStorage.getUser(
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

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }
}
