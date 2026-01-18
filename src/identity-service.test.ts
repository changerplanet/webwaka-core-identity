import { IdentityService } from './identity-service';
import { InMemoryUserStorage, InMemorySessionStorage } from './storage';
import { CreateUserInput, AuthenticateInput } from './types';

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(() => {
    service = new IdentityService({
      userStorage: new InMemoryUserStorage(),
      sessionStorage: new InMemorySessionStorage(),
      sessionDurationMs: 60 * 60 * 1000, // 1 hour for testing
    });
  });

  describe('createUser', () => {
    it('should create a user with valid input', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const user = await service.createUser(input);

      expect(user.userId).toBeDefined();
      expect(user.tenantId).toBe('tenant-1');
      expect(user.phone).toBe('+2348012345678'); // Normalized
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
    });

    it('should normalize phone numbers', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '0801 234 5678',
      };

      const user = await service.createUser(input);
      expect(user.phone).toBe('+2348012345678');
    });

    it('should reject duplicate phone numbers in same tenant', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      await service.createUser(input);

      await expect(service.createUser(input)).rejects.toThrow('already exists');
    });

    it('should allow same phone number in different tenants', async () => {
      const input1: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      const input2: CreateUserInput = {
        tenantId: 'tenant-2',
        phone: '08012345678',
      };

      const user1 = await service.createUser(input1);
      const user2 = await service.createUser(input2);

      expect(user1.tenantId).toBe('tenant-1');
      expect(user2.tenantId).toBe('tenant-2');
      expect(user1.phone).toBe(user2.phone);
    });
  });

  describe('getUser', () => {
    it('should retrieve user by ID', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      const created = await service.createUser(input);
      const retrieved = await service.getUser('tenant-1', created.userId);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent user', async () => {
      const user = await service.getUser('tenant-1', 'non-existent');
      expect(user).toBeNull();
    });

    it('should enforce tenant isolation', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      const created = await service.createUser(input);
      const retrieved = await service.getUser('tenant-2', created.userId);

      expect(retrieved).toBeNull();
    });
  });

  describe('getUserByPhone', () => {
    it('should retrieve user by phone number', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      const created = await service.createUser(input);
      const retrieved = await service.getUserByPhone('tenant-1', '08012345678');

      expect(retrieved).toEqual(created);
    });

    it('should normalize phone before lookup', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      await service.createUser(input);
      const retrieved = await service.getUserByPhone('tenant-1', '+234 801 234 5678');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.phone).toBe('+2348012345678');
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const input: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
        displayName: 'Original Name',
      };

      const created = await service.createUser(input);
      const updated = await service.updateUser('tenant-1', created.userId, {
        displayName: 'Updated Name',
        email: 'updated@example.com',
      });

      expect(updated.displayName).toBe('Updated Name');
      expect(updated.email).toBe('updated@example.com');
      expect(updated.phone).toBe(created.phone); // Immutable
    });
  });

  describe('authenticate', () => {
    it('should create a session for valid credentials', async () => {
      const userInput: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      await service.createUser(userInput);

      const authInput: AuthenticateInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
        credential: 'password123',
      };

      const result = await service.authenticate(authInput, ['user']);

      expect(result.sessionId).toBeDefined();
      expect(result.tenantId).toBe('tenant-1');
      expect(result.roles).toEqual(['user']);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should reject invalid credentials', async () => {
      const authInput: AuthenticateInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
        credential: 'password123',
      };

      await expect(service.authenticate(authInput)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const userInput: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      await service.createUser(userInput);

      const authResult = await service.authenticate({
        tenantId: 'tenant-1',
        phone: '08012345678',
        credential: 'password123',
      });

      const validation = await service.validateSession(authResult.sessionId);

      expect(validation.valid).toBe(true);
      expect(validation.context?.sessionId).toBe(authResult.sessionId);
    });

    it('should reject invalid session', async () => {
      const validation = await service.validateSession('invalid-session');

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Session not found');
    });
  });

  describe('resolveIdentity', () => {
    it('should resolve identity from session', async () => {
      const userInput: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
        displayName: 'Test User',
      };

      await service.createUser(userInput);

      const authResult = await service.authenticate({
        tenantId: 'tenant-1',
        phone: '08012345678',
        credential: 'password123',
      }, ['admin']);

      const identity = await service.resolveIdentity(authResult.sessionId);

      expect(identity.tenantId).toBe('tenant-1');
      expect(identity.roles).toEqual(['admin']);
      expect(identity.profile.displayName).toBe('Test User');
    });
  });

  describe('logout', () => {
    it('should delete session on logout', async () => {
      const userInput: CreateUserInput = {
        tenantId: 'tenant-1',
        phone: '08012345678',
      };

      await service.createUser(userInput);

      const authResult = await service.authenticate({
        tenantId: 'tenant-1',
        phone: '08012345678',
        credential: 'password123',
      });

      await service.logout(authResult.sessionId);

      const validation = await service.validateSession(authResult.sessionId);
      expect(validation.valid).toBe(false);
    });
  });

  describe('tenant isolation', () => {
    it('should enforce tenant isolation in all operations', async () => {
      const user1 = await service.createUser({
        tenantId: 'tenant-1',
        phone: '08012345678',
      });

      const user2 = await service.createUser({
        tenantId: 'tenant-2',
        phone: '08087654321',
      });

      const crossTenantAccess = await service.getUser('tenant-1', user2.userId);
      expect(crossTenantAccess).toBeNull();

      const authResult = await service.authenticate({
        tenantId: 'tenant-1',
        phone: '08012345678',
        credential: 'password123',
      });

      const identity = await service.resolveIdentity(authResult.sessionId);
      expect(identity.tenantId).toBe('tenant-1');
      expect(identity.userId).toBe(user1.userId);
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve user by email', async () => {
      const input = {
        tenantId: 'tenant-1',
        phone: '08012345678',
        email: 'user@example.com',
      };

      const created = await service.createUser(input);
      const retrieved = await service.getUserByEmail('tenant-1', 'user@example.com');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.email).toBe('user@example.com');
      expect(retrieved!.userId).toBe(created.userId);
    });

    it('should be case insensitive for email lookup', async () => {
      await service.createUser({
        tenantId: 'tenant-1',
        phone: '08012345678',
        email: 'User@Example.COM',
      });

      const retrieved = await service.getUserByEmail('tenant-1', 'user@example.com');
      expect(retrieved).not.toBeNull();
    });

    it('should return null for non-existent email', async () => {
      const user = await service.getUserByEmail('tenant-1', 'nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should enforce tenant isolation for email lookup', async () => {
      await service.createUser({
        tenantId: 'tenant-1',
        phone: '08012345678',
        email: 'isolated@example.com',
      });

      const retrieved = await service.getUserByEmail('tenant-2', 'isolated@example.com');
      expect(retrieved).toBeNull();
    });
  });

  describe('listUsers', () => {
    it('should list users in a tenant', async () => {
      await service.createUser({
        tenantId: 'list-tenant',
        phone: '08011111111',
      });
      await service.createUser({
        tenantId: 'list-tenant',
        phone: '08022222222',
      });
      await service.createUser({
        tenantId: 'other-tenant',
        phone: '08033333333',
      });

      const users = await service.listUsers('list-tenant');

      expect(users).toHaveLength(2);
      expect(users.every(u => u.tenantId === 'list-tenant')).toBe(true);
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await service.createUser({
          tenantId: 'paginated-tenant',
          phone: `0801234567${i}`,
        });
      }

      const page1 = await service.listUsers('paginated-tenant', { limit: 2, offset: 0 });
      const page2 = await service.listUsers('paginated-tenant', { limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });

    it('should return empty array for tenant with no users', async () => {
      const users = await service.listUsers('empty-tenant');
      expect(users).toEqual([]);
    });
  });

  describe('assertTenantContext', () => {
    it('should return tenant context from valid session', async () => {
      await service.createUser({
        tenantId: 'context-tenant',
        phone: '08099999999',
      });

      const authResult = await service.authenticate({
        tenantId: 'context-tenant',
        phone: '08099999999',
        credential: 'password',
      }, ['admin', 'user']);

      const context = await service.assertTenantContext(authResult.sessionId);

      expect(context.tenantId).toBe('context-tenant');
      expect(context.userId).toBeDefined();
      expect(context.roles).toContain('admin');
      expect(context.roles).toContain('user');
      expect(context.sessionId).toBe(authResult.sessionId);
    });

    it('should throw for invalid session', async () => {
      await expect(
        service.assertTenantContext('invalid-session')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and their sessions', async () => {
      const user = await service.createUser({
        tenantId: 'delete-tenant',
        phone: '08077777777',
      });

      const authResult = await service.authenticate({
        tenantId: 'delete-tenant',
        phone: '08077777777',
        credential: 'password',
      });

      await service.deleteUser('delete-tenant', user.userId);

      const deletedUser = await service.getUser('delete-tenant', user.userId);
      const validation = await service.validateSession(authResult.sessionId);

      expect(deletedUser).toBeNull();
      expect(validation.valid).toBe(false);
    });
  });

  describe('logoutAll', () => {
    it('should delete all sessions for a user', async () => {
      const user = await service.createUser({
        tenantId: 'multi-session-tenant',
        phone: '08066666666',
      });

      const session1 = await service.authenticate({
        tenantId: 'multi-session-tenant',
        phone: '08066666666',
        credential: 'password',
      });

      const session2 = await service.authenticate({
        tenantId: 'multi-session-tenant',
        phone: '08066666666',
        credential: 'password',
      });

      await service.logoutAll('multi-session-tenant', user.userId);

      const validation1 = await service.validateSession(session1.sessionId);
      const validation2 = await service.validateSession(session2.sessionId);

      expect(validation1.valid).toBe(false);
      expect(validation2.valid).toBe(false);
    });
  });
});
