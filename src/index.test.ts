/**
 * Index exports test
 * 
 * Verifies all exports are correctly exposed from the module
 */

import * as CoreIdentity from './index';

describe('Module exports', () => {
  it('should export IdentityService', () => {
    expect(CoreIdentity.IdentityService).toBeDefined();
    expect(typeof CoreIdentity.IdentityService).toBe('function');
  });

  it('should export storage classes', () => {
    expect(CoreIdentity.InMemoryUserStorage).toBeDefined();
    expect(CoreIdentity.InMemorySessionStorage).toBeDefined();
  });

  it('should export Clerk adapter components', () => {
    expect(CoreIdentity.MockClerkAdapter).toBeDefined();
    expect(CoreIdentity.clerkUserToProfile).toBeDefined();
    expect(CoreIdentity.extractTenantContext).toBeDefined();
  });

  it('should export phone utilities', () => {
    expect(CoreIdentity.normalizeNigerianPhone).toBeDefined();
    expect(CoreIdentity.isValidNigerianPhone).toBeDefined();
    expect(CoreIdentity.formatNigerianPhone).toBeDefined();
  });

  it('should export validation schemas', () => {
    expect(CoreIdentity.validate).toBeDefined();
    expect(CoreIdentity.TenantIdSchema).toBeDefined();
    expect(CoreIdentity.UserIdSchema).toBeDefined();
    expect(CoreIdentity.CreateUserInputSchema).toBeDefined();
  });

  it('should be able to instantiate IdentityService', () => {
    const service = new CoreIdentity.IdentityService({
      userStorage: new CoreIdentity.InMemoryUserStorage(),
      sessionStorage: new CoreIdentity.InMemorySessionStorage(),
    });
    
    expect(service).toBeInstanceOf(CoreIdentity.IdentityService);
  });
});
