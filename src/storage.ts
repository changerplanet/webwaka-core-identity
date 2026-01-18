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
export class InMemoryUserStorage implements UserStorage {
  private users: Map<string, UserProfile> = new Map();

  private getKey(tenantId: TenantId, userId: UserId): string {
    return `${tenantId}:${userId}`;
  }

  private getPhoneKey(tenantId: TenantId, phone: string): string {
    return `${tenantId}:phone:${phone}`;
  }

  private getEmailKey(tenantId: TenantId, email: string): string {
    return `${tenantId}:email:${email.toLowerCase()}`;
  }

  async createUser(profile: UserProfile): Promise<UserProfile> {
    const key = this.getKey(profile.tenantId, profile.userId);
    const phoneKey = this.getPhoneKey(profile.tenantId, profile.phone);
    
    if (this.users.has(key)) {
      throw new Error(`User already exists: ${profile.userId}`);
    }
    
    if (this.users.has(phoneKey)) {
      throw new Error(`Phone number already registered: ${profile.phone}`);
    }
    
    this.users.set(key, profile);
    this.users.set(phoneKey, profile);
    
    if (profile.email) {
      const emailKey = this.getEmailKey(profile.tenantId, profile.email);
      this.users.set(emailKey, profile);
    }
    
    return profile;
  }

  async getUser(tenantId: TenantId, userId: UserId): Promise<UserProfile | null> {
    const key = this.getKey(tenantId, userId);
    return this.users.get(key) || null;
  }

  async getUserByPhone(tenantId: TenantId, phone: string): Promise<UserProfile | null> {
    const phoneKey = this.getPhoneKey(tenantId, phone);
    return this.users.get(phoneKey) || null;
  }

  async getUserByEmail(tenantId: TenantId, email: string): Promise<UserProfile | null> {
    const emailKey = this.getEmailKey(tenantId, email);
    return this.users.get(emailKey) || null;
  }

  async updateUser(tenantId: TenantId, userId: UserId, updates: Partial<UserProfile>): Promise<UserProfile> {
    const key = this.getKey(tenantId, userId);
    const existing = this.users.get(key);
    
    if (!existing) {
      throw new Error(`User not found: ${userId}`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      userId: existing.userId, // Immutable
      tenantId: existing.tenantId, // Immutable
      phone: existing.phone, // Immutable
      createdAt: existing.createdAt, // Immutable
      updatedAt: new Date(),
    };
    
    this.users.set(key, updated);
    return updated;
  }

  async deleteUser(tenantId: TenantId, userId: UserId): Promise<void> {
    const key = this.getKey(tenantId, userId);
    const user = this.users.get(key);
    
    if (user) {
      const phoneKey = this.getPhoneKey(tenantId, user.phone);
      this.users.delete(key);
      this.users.delete(phoneKey);
      
      if (user.email) {
        const emailKey = this.getEmailKey(tenantId, user.email);
        this.users.delete(emailKey);
      }
    }
  }

  async listUsers(tenantId: TenantId, limit: number, offset: number): Promise<UserProfile[]> {
    const seen = new Set<string>();
    const tenantUsers: UserProfile[] = [];
    
    for (const user of this.users.values()) {
      if (user.tenantId === tenantId && !seen.has(user.userId)) {
        seen.add(user.userId);
        tenantUsers.push(user);
      }
    }
    
    return tenantUsers.slice(offset, offset + limit);
  }
}

/**
 * In-memory implementation for sessions
 */
export class InMemorySessionStorage implements SessionStorage {
  private sessions: Map<SessionId, SessionContext> = new Map();

  async createSession(context: SessionContext): Promise<SessionContext> {
    this.sessions.set(context.sessionId, context);
    return context;
  }

  async getSession(sessionId: SessionId): Promise<SessionContext | null> {
    return this.sessions.get(sessionId) || null;
  }

  async deleteSession(sessionId: SessionId): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteUserSessions(tenantId: TenantId, userId: UserId): Promise<void> {
    for (const [sessionId, context] of this.sessions.entries()) {
      if (context.tenantId === tenantId && context.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
