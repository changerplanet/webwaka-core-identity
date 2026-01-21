"use strict";
/**
 * Storage interface for identity data
 *
 * This is an abstraction layer that allows the identity service to be
 * storage-agnostic. Implementations can use any database or storage backend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySessionStorage = exports.InMemoryUserStorage = void 0;
/**
 * In-memory implementation for testing and development
 */
class InMemoryUserStorage {
    constructor() {
        this.users = new Map();
    }
    getKey(tenantId, userId) {
        return `${tenantId}:${userId}`;
    }
    getPhoneKey(tenantId, phone) {
        return `${tenantId}:phone:${phone}`;
    }
    getEmailKey(tenantId, email) {
        return `${tenantId}:email:${email.toLowerCase()}`;
    }
    async createUser(profile) {
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
    async getUser(tenantId, userId) {
        const key = this.getKey(tenantId, userId);
        return this.users.get(key) || null;
    }
    async getUserByPhone(tenantId, phone) {
        const phoneKey = this.getPhoneKey(tenantId, phone);
        return this.users.get(phoneKey) || null;
    }
    async getUserByEmail(tenantId, email) {
        const emailKey = this.getEmailKey(tenantId, email);
        return this.users.get(emailKey) || null;
    }
    async updateUser(tenantId, userId, updates) {
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
    async deleteUser(tenantId, userId) {
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
    async listUsers(tenantId, limit, offset) {
        const seen = new Set();
        const tenantUsers = [];
        for (const user of this.users.values()) {
            if (user.tenantId === tenantId && !seen.has(user.userId)) {
                seen.add(user.userId);
                tenantUsers.push(user);
            }
        }
        return tenantUsers.slice(offset, offset + limit);
    }
}
exports.InMemoryUserStorage = InMemoryUserStorage;
/**
 * In-memory implementation for sessions
 */
class InMemorySessionStorage {
    constructor() {
        this.sessions = new Map();
    }
    async createSession(context) {
        this.sessions.set(context.sessionId, context);
        return context;
    }
    async getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    async deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    async deleteUserSessions(tenantId, userId) {
        for (const [sessionId, context] of this.sessions.entries()) {
            if (context.tenantId === tenantId && context.userId === userId) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
exports.InMemorySessionStorage = InMemorySessionStorage;
//# sourceMappingURL=storage.js.map