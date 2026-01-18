/**
 * Clerk Adapter Tests
 * 
 * Tests for Clerk adapter behavior including:
 * - Session verification
 * - User lookup by various identifiers
 * - Tenant isolation
 * - Phone normalization integration
 * - Identity resolution
 */

import {
  MockClerkAdapter,
  ClerkUser,
  ClerkSessionClaims,
  clerkUserToProfile,
  extractTenantContext,
} from './clerk-adapter';
import { IdentityService } from './identity-service';
import { InMemoryUserStorage, InMemorySessionStorage } from './storage';

describe('MockClerkAdapter', () => {
  let adapter: MockClerkAdapter;

  beforeEach(() => {
    adapter = new MockClerkAdapter();
  });

  afterEach(() => {
    adapter.clear();
  });

  describe('session management', () => {
    const validClaims: ClerkSessionClaims = {
      sub: 'user_123',
      sid: 'session_456',
      org_id: 'org_tenant1',
      org_role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should verify valid session', async () => {
      adapter.addSession('token_abc', validClaims);
      
      const result = await adapter.verifySession('token_abc');
      
      expect(result).toEqual(validClaims);
    });

    it('should return null for unknown session', async () => {
      const result = await adapter.verifySession('unknown_token');
      
      expect(result).toBeNull();
    });

    it('should return null and remove expired session', async () => {
      const expiredClaims: ClerkSessionClaims = {
        ...validClaims,
        exp: Math.floor(Date.now() / 1000) - 100,
      };
      adapter.addSession('expired_token', expiredClaims);
      
      const result = await adapter.verifySession('expired_token');
      
      expect(result).toBeNull();
      
      const secondResult = await adapter.verifySession('expired_token');
      expect(secondResult).toBeNull();
    });

    it('should allow removing sessions', async () => {
      adapter.addSession('token_abc', validClaims);
      adapter.removeSession('token_abc');
      
      const result = await adapter.verifySession('token_abc');
      
      expect(result).toBeNull();
    });
  });

  describe('user management', () => {
    const testUser: ClerkUser = {
      id: 'user_123',
      primaryEmailAddressId: 'email_1',
      primaryPhoneNumberId: 'phone_1',
      emailAddresses: [
        { id: 'email_1', emailAddress: 'test@example.com' },
      ],
      phoneNumbers: [
        { id: 'phone_1', phoneNumber: '+2348012345678' },
      ],
      firstName: 'John',
      lastName: 'Doe',
      publicMetadata: { tier: 'premium' },
      privateMetadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should get user by ID', async () => {
      adapter.addUser(testUser);
      
      const result = await adapter.getUser('user_123');
      
      expect(result).toEqual(testUser);
    });

    it('should return null for unknown user ID', async () => {
      const result = await adapter.getUser('unknown_user');
      
      expect(result).toBeNull();
    });

    it('should get user by email (case insensitive)', async () => {
      adapter.addUser(testUser);
      
      const result1 = await adapter.getUserByEmail('test@example.com');
      const result2 = await adapter.getUserByEmail('TEST@EXAMPLE.COM');
      
      expect(result1).toEqual(testUser);
      expect(result2).toEqual(testUser);
    });

    it('should return null for unknown email', async () => {
      const result = await adapter.getUserByEmail('unknown@example.com');
      
      expect(result).toBeNull();
    });

    it('should get user by phone', async () => {
      adapter.addUser(testUser);
      
      const result = await adapter.getUserByPhone('+2348012345678');
      
      expect(result).toEqual(testUser);
    });

    it('should return null for unknown phone', async () => {
      const result = await adapter.getUserByPhone('+2349999999999');
      
      expect(result).toBeNull();
    });

    it('should remove user and all indexes', async () => {
      adapter.addUser(testUser);
      adapter.removeUser('user_123');
      
      expect(await adapter.getUser('user_123')).toBeNull();
      expect(await adapter.getUserByEmail('test@example.com')).toBeNull();
      expect(await adapter.getUserByPhone('+2348012345678')).toBeNull();
    });
  });

  describe('organization members', () => {
    const user1: ClerkUser = {
      id: 'user_1',
      emailAddresses: [{ id: 'e1', emailAddress: 'user1@example.com' }],
      phoneNumbers: [{ id: 'p1', phoneNumber: '+2348011111111' }],
      publicMetadata: {},
      privateMetadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const user2: ClerkUser = {
      id: 'user_2',
      emailAddresses: [{ id: 'e2', emailAddress: 'user2@example.com' }],
      phoneNumbers: [{ id: 'p2', phoneNumber: '+2348022222222' }],
      publicMetadata: {},
      privateMetadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should list organization members', async () => {
      adapter.addUser(user1);
      adapter.addUser(user2);
      adapter.addOrgMember('org_1', 'user_1');
      adapter.addOrgMember('org_1', 'user_2');
      
      const members = await adapter.listOrganizationMembers('org_1');
      
      expect(members).toHaveLength(2);
      expect(members.map(m => m.id)).toContain('user_1');
      expect(members.map(m => m.id)).toContain('user_2');
    });

    it('should return empty array for unknown org', async () => {
      const members = await adapter.listOrganizationMembers('unknown_org');
      
      expect(members).toEqual([]);
    });

    it('should enforce tenant isolation - org members only', async () => {
      adapter.addUser(user1);
      adapter.addUser(user2);
      adapter.addOrgMember('org_1', 'user_1');
      adapter.addOrgMember('org_2', 'user_2');
      
      const org1Members = await adapter.listOrganizationMembers('org_1');
      const org2Members = await adapter.listOrganizationMembers('org_2');
      
      expect(org1Members).toHaveLength(1);
      expect(org1Members[0].id).toBe('user_1');
      
      expect(org2Members).toHaveLength(1);
      expect(org2Members[0].id).toBe('user_2');
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      const user: ClerkUser = {
        id: 'user_1',
        emailAddresses: [{ id: 'e1', emailAddress: 'test@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348011111111' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      adapter.addUser(user);
      adapter.addSession('token', {
        sub: 'user_1',
        sid: 'session_1',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      adapter.addOrgMember('org_1', 'user_1');
      
      adapter.clear();
      
      expect(await adapter.getUser('user_1')).toBeNull();
      expect(await adapter.verifySession('token')).toBeNull();
      expect(await adapter.listOrganizationMembers('org_1')).toEqual([]);
    });
  });
});

describe('clerkUserToProfile', () => {
  it('should convert Clerk user to UserProfile', () => {
    const clerkUser: ClerkUser = {
      id: 'user_123',
      primaryEmailAddressId: 'email_1',
      primaryPhoneNumberId: 'phone_1',
      emailAddresses: [
        { id: 'email_1', emailAddress: 'test@example.com' },
      ],
      phoneNumbers: [
        { id: 'phone_1', phoneNumber: '+2348012345678' },
      ],
      firstName: 'John',
      lastName: 'Doe',
      publicMetadata: { tier: 'premium' },
      privateMetadata: {},
      createdAt: 1700000000000,
      updatedAt: 1700001000000,
    };
    
    const profile = clerkUserToProfile(clerkUser, 'tenant_1');
    
    expect(profile.userId).toBe('user_123');
    expect(profile.tenantId).toBe('tenant_1');
    expect(profile.email).toBe('test@example.com');
    expect(profile.phone).toBe('+2348012345678');
    expect(profile.displayName).toBe('John Doe');
    expect(profile.metadata).toEqual({ tier: 'premium', clerkId: 'user_123' });
    expect(profile.createdAt).toEqual(new Date(1700000000000));
    expect(profile.updatedAt).toEqual(new Date(1700001000000));
  });

  it('should handle missing optional fields', () => {
    const clerkUser: ClerkUser = {
      id: 'user_456',
      emailAddresses: [],
      phoneNumbers: [{ id: 'p1', phoneNumber: '+2349876543210' }],
      publicMetadata: {},
      privateMetadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const profile = clerkUserToProfile(clerkUser, 'tenant_2');
    
    expect(profile.userId).toBe('user_456');
    expect(profile.email).toBeUndefined();
    expect(profile.displayName).toBeUndefined();
    expect(profile.phone).toBe('+2349876543210');
  });
});

describe('extractTenantContext', () => {
  it('should extract tenant context from claims', () => {
    const claims: ClerkSessionClaims = {
      sub: 'user_123',
      sid: 'session_456',
      org_id: 'org_tenant1',
      org_role: 'admin',
      metadata: { roles: ['editor', 'viewer'] },
      iat: 1700000000,
      exp: 1700003600,
    };
    
    const context = extractTenantContext(claims);
    
    expect(context.tenantId).toBe('org_tenant1');
    expect(context.userId).toBe('user_123');
    expect(context.sessionId).toBe('session_456');
    expect(context.roles).toContain('admin');
    expect(context.roles).toContain('editor');
    expect(context.roles).toContain('viewer');
    expect(context.issuedAt).toEqual(new Date(1700000000000));
    expect(context.expiresAt).toEqual(new Date(1700003600000));
  });

  it('should use default tenant if org_id is missing', () => {
    const claims: ClerkSessionClaims = {
      sub: 'user_123',
      sid: 'session_456',
      iat: 1700000000,
      exp: 1700003600,
    };
    
    const context = extractTenantContext(claims);
    
    expect(context.tenantId).toBe('default');
    expect(context.roles).toEqual([]);
  });
});

describe('IdentityService with Clerk Adapter', () => {
  let adapter: MockClerkAdapter;
  let service: IdentityService;

  beforeEach(() => {
    adapter = new MockClerkAdapter();
    service = new IdentityService({
      userStorage: new InMemoryUserStorage(),
      sessionStorage: new InMemorySessionStorage(),
      clerkAdapter: adapter,
    });
  });

  afterEach(() => {
    adapter.clear();
  });

  describe('resolveIdentity with Clerk', () => {
    it('should resolve identity from valid Clerk session', async () => {
      const clerkUser: ClerkUser = {
        id: 'user_123',
        primaryEmailAddressId: 'email_1',
        primaryPhoneNumberId: 'phone_1',
        emailAddresses: [{ id: 'email_1', emailAddress: 'john@example.com' }],
        phoneNumbers: [{ id: 'phone_1', phoneNumber: '+2348012345678' }],
        firstName: 'John',
        lastName: 'Doe',
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const claims: ClerkSessionClaims = {
        sub: 'user_123',
        sid: 'session_456',
        org_id: 'tenant_1',
        org_role: 'member',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      adapter.addUser(clerkUser);
      adapter.addOrgMember('tenant_1', 'user_123');
      adapter.addSession('valid_token', claims);

      const identity = await service.resolveIdentity('valid_token');

      expect(identity.userId).toBe('user_123');
      expect(identity.tenantId).toBe('tenant_1');
      expect(identity.roles).toContain('member');
      expect(identity.profile.phone).toBe('+2348012345678');
      expect(identity.profile.email).toBe('john@example.com');
    });

    it('should throw for invalid session token', async () => {
      await expect(
        service.resolveIdentity('invalid_token')
      ).rejects.toThrow('Invalid session');
    });

    it('should throw for expired session', async () => {
      const expiredClaims: ClerkSessionClaims = {
        sub: 'user_123',
        sid: 'session_456',
        org_id: 'tenant_1',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      adapter.addSession('expired_token', expiredClaims);

      await expect(
        service.resolveIdentity('expired_token')
      ).rejects.toThrow('Invalid session');
    });
  });

  describe('assertTenantContext with Clerk', () => {
    it('should return tenant context from valid session', async () => {
      const clerkUser: ClerkUser = {
        id: 'user_abc',
        emailAddresses: [{ id: 'e1', emailAddress: 'test@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348099999999' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const claims: ClerkSessionClaims = {
        sub: 'user_abc',
        sid: 'session_xyz',
        org_id: 'tenant_acme',
        org_role: 'admin',
        metadata: { roles: ['superuser'] },
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      adapter.addUser(clerkUser);
      adapter.addSession('context_token', claims);

      const context = await service.assertTenantContext('context_token');

      expect(context.tenantId).toBe('tenant_acme');
      expect(context.userId).toBe('user_abc');
      expect(context.roles).toContain('admin');
      expect(context.roles).toContain('superuser');
      expect(context.sessionId).toBe('session_xyz');
    });

    it('should throw for invalid session', async () => {
      await expect(
        service.assertTenantContext('bad_token')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getUser with Clerk', () => {
    const clerkUser: ClerkUser = {
      id: 'user_lookup',
      primaryEmailAddressId: 'e1',
      emailAddresses: [{ id: 'e1', emailAddress: 'lookup@example.com' }],
      phoneNumbers: [{ id: 'p1', phoneNumber: '+2348055555555' }],
      firstName: 'Lookup',
      lastName: 'User',
      publicMetadata: {},
      privateMetadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    beforeEach(() => {
      adapter.addUser(clerkUser);
      adapter.addOrgMember('tenant_1', 'user_lookup');
    });

    it('should get user by ID via Clerk', async () => {
      const user = await service.getUser('tenant_1', 'user_lookup');

      expect(user).not.toBeNull();
      expect(user!.userId).toBe('user_lookup');
      expect(user!.tenantId).toBe('tenant_1');
    });

    it('should get user by email via Clerk', async () => {
      const user = await service.getUserByEmail('tenant_1', 'lookup@example.com');

      expect(user).not.toBeNull();
      expect(user!.email).toBe('lookup@example.com');
    });

    it('should get user by phone via Clerk with normalization', async () => {
      const user = await service.getUserByPhone('tenant_1', '08055555555');

      expect(user).not.toBeNull();
      expect(user!.phone).toBe('+2348055555555');
    });

    it('should return null for non-existent user', async () => {
      const user = await service.getUser('tenant_1', 'nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('listUsers with Clerk', () => {
    it('should list organization members', async () => {
      const user1: ClerkUser = {
        id: 'member_1',
        emailAddresses: [{ id: 'e1', emailAddress: 'm1@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348011111111' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const user2: ClerkUser = {
        id: 'member_2',
        emailAddresses: [{ id: 'e2', emailAddress: 'm2@example.com' }],
        phoneNumbers: [{ id: 'p2', phoneNumber: '+2348022222222' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      adapter.addUser(user1);
      adapter.addUser(user2);
      adapter.addOrgMember('tenant_list', 'member_1');
      adapter.addOrgMember('tenant_list', 'member_2');

      const users = await service.listUsers('tenant_list');

      expect(users).toHaveLength(2);
      expect(users.map(u => u.userId)).toContain('member_1');
      expect(users.map(u => u.userId)).toContain('member_2');
    });

    it('should respect pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const user: ClerkUser = {
          id: `paginated_user_${i}`,
          emailAddresses: [{ id: `e${i}`, emailAddress: `p${i}@example.com` }],
          phoneNumbers: [{ id: `p${i}`, phoneNumber: `+234801234567${i}` }],
          publicMetadata: {},
          privateMetadata: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        adapter.addUser(user);
        adapter.addOrgMember('paginated_tenant', `paginated_user_${i}`);
      }

      const page1 = await service.listUsers('paginated_tenant', { limit: 2, offset: 0 });
      const page2 = await service.listUsers('paginated_tenant', { limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  describe('tenant isolation', () => {
    it('should enforce tenant isolation for user queries', async () => {
      const user1: ClerkUser = {
        id: 'isolated_user_1',
        emailAddresses: [{ id: 'e1', emailAddress: 'isolated1@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348077777777' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      adapter.addUser(user1);
      adapter.addOrgMember('tenant_a', 'isolated_user_1');

      const tenantAUsers = await service.listUsers('tenant_a');
      const tenantBUsers = await service.listUsers('tenant_b');

      expect(tenantAUsers).toHaveLength(1);
      expect(tenantBUsers).toHaveLength(0);
    });

    it('should enforce tenant context in identity resolution', async () => {
      const user: ClerkUser = {
        id: 'context_user',
        emailAddresses: [{ id: 'e1', emailAddress: 'ctx@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348088888888' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const claimsA: ClerkSessionClaims = {
        sub: 'context_user',
        sid: 'session_a',
        org_id: 'tenant_alpha',
        org_role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const claimsB: ClerkSessionClaims = {
        sub: 'context_user',
        sid: 'session_b',
        org_id: 'tenant_beta',
        org_role: 'viewer',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      adapter.addUser(user);
      adapter.addOrgMember('tenant_alpha', 'context_user');
      adapter.addOrgMember('tenant_beta', 'context_user');
      adapter.addSession('token_alpha', claimsA);
      adapter.addSession('token_beta', claimsB);

      const identityA = await service.resolveIdentity('token_alpha');
      const identityB = await service.resolveIdentity('token_beta');

      expect(identityA.tenantId).toBe('tenant_alpha');
      expect(identityA.roles).toContain('admin');

      expect(identityB.tenantId).toBe('tenant_beta');
      expect(identityB.roles).toContain('viewer');
    });

    it('should prevent cross-tenant user access by ID', async () => {
      const user: ClerkUser = {
        id: 'cross_tenant_user',
        emailAddresses: [{ id: 'e1', emailAddress: 'cross@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348011112222' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      adapter.addUser(user);
      adapter.addOrgMember('tenant_x', 'cross_tenant_user');

      const foundInTenantX = await service.getUser('tenant_x', 'cross_tenant_user');
      const notFoundInTenantY = await service.getUser('tenant_y', 'cross_tenant_user');

      expect(foundInTenantX).not.toBeNull();
      expect(foundInTenantX!.tenantId).toBe('tenant_x');
      expect(notFoundInTenantY).toBeNull();
    });

    it('should prevent cross-tenant user access by phone', async () => {
      const user: ClerkUser = {
        id: 'phone_cross_user',
        emailAddresses: [],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348033334444' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      adapter.addUser(user);
      adapter.addOrgMember('phone_tenant_a', 'phone_cross_user');

      const foundInA = await service.getUserByPhone('phone_tenant_a', '+2348033334444');
      const notFoundInB = await service.getUserByPhone('phone_tenant_b', '+2348033334444');

      expect(foundInA).not.toBeNull();
      expect(notFoundInB).toBeNull();
    });

    it('should prevent cross-tenant user access by email', async () => {
      const user: ClerkUser = {
        id: 'email_cross_user',
        primaryEmailAddressId: 'e1',
        emailAddresses: [{ id: 'e1', emailAddress: 'crossemail@example.com' }],
        phoneNumbers: [{ id: 'p1', phoneNumber: '+2348055556666' }],
        publicMetadata: {},
        privateMetadata: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      adapter.addUser(user);
      adapter.addOrgMember('email_tenant_a', 'email_cross_user');

      const foundInA = await service.getUserByEmail('email_tenant_a', 'crossemail@example.com');
      const notFoundInB = await service.getUserByEmail('email_tenant_b', 'crossemail@example.com');

      expect(foundInA).not.toBeNull();
      expect(foundInA!.email).toBe('crossemail@example.com');
      expect(notFoundInB).toBeNull();
    });
  });
});

describe('HARD STOP PROOF: Session token returns (tenantId, userId, roles, metadata)', () => {
  let adapter: MockClerkAdapter;
  let service: IdentityService;

  beforeEach(() => {
    adapter = new MockClerkAdapter();
    service = new IdentityService({
      userStorage: new InMemoryUserStorage(),
      sessionStorage: new InMemorySessionStorage(),
      clerkAdapter: adapter,
    });
  });

  it('Suite can provide session token and receive tenantId, userId, roles, and identity metadata', async () => {
    const clerkUser: ClerkUser = {
      id: 'suite_user_123',
      primaryEmailAddressId: 'e1',
      primaryPhoneNumberId: 'p1',
      emailAddresses: [{ id: 'e1', emailAddress: 'suite@webwaka.com' }],
      phoneNumbers: [{ id: 'p1', phoneNumber: '+2348012345678' }],
      firstName: 'Suite',
      lastName: 'User',
      publicMetadata: { plan: 'enterprise', customField: 'customValue' },
      privateMetadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessionClaims: ClerkSessionClaims = {
      sub: 'suite_user_123',
      sid: 'suite_session_abc',
      org_id: 'suite_tenant_xyz',
      org_role: 'org:admin',
      metadata: { roles: ['billing_admin', 'support_lead'] },
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    adapter.addUser(clerkUser);
    adapter.addOrgMember('suite_tenant_xyz', 'suite_user_123');
    adapter.addSession('suite_session_token_123', sessionClaims);

    const identity = await service.resolveIdentity('suite_session_token_123');

    expect(identity.tenantId).toBe('suite_tenant_xyz');
    expect(identity.userId).toBe('suite_user_123');
    
    expect(identity.roles).toContain('org:admin');
    expect(identity.roles).toContain('billing_admin');
    expect(identity.roles).toContain('support_lead');
    
    expect(identity.profile).toBeDefined();
    expect(identity.profile.email).toBe('suite@webwaka.com');
    expect(identity.profile.phone).toBe('+2348012345678');
    expect(identity.profile.displayName).toBe('Suite User');
    expect(identity.profile.metadata?.plan).toBe('enterprise');
    expect(identity.profile.metadata?.customField).toBe('customValue');
    expect(identity.profile.metadata?.clerkId).toBe('suite_user_123');
  });
});
