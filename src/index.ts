/**
 * WebWaka Core Identity Service
 * 
 * Provides canonical identity resolution, user profiles, authentication primitives,
 * and tenant-aware session context for the WebWaka platform.
 */

// Main service
export { IdentityService, IdentityServiceConfig } from './identity-service';

// Types
export {
  TenantId,
  UserId,
  RoleId,
  SessionId,
  NigerianPhone,
  UserProfile,
  AuthResult,
  SessionContext,
  IdentityResolution,
  CreateUserInput,
  UpdateUserInput,
  AuthenticateInput,
  SessionValidation,
} from './types';

// Storage interfaces
export {
  UserStorage,
  SessionStorage,
  InMemoryUserStorage,
  InMemorySessionStorage,
} from './storage';

// Utilities
export {
  normalizeNigerianPhone,
  isValidNigerianPhone,
  formatNigerianPhone,
} from './phone-utils';

// Validation
export {
  validate,
  TenantIdSchema,
  UserIdSchema,
  RoleIdSchema,
  SessionIdSchema,
  NigerianPhoneSchema,
  EmailSchema,
  DisplayNameSchema,
  MetadataSchema,
  CreateUserInputSchema,
  UpdateUserInputSchema,
  AuthenticateInputSchema,
} from './validation';
