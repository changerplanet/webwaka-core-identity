/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';
import { isValidNigerianPhone } from './phone-utils';

/**
 * Tenant ID validation
 */
export const TenantIdSchema = z.string().min(1).max(255);

/**
 * User ID validation
 */
export const UserIdSchema = z.string().min(1).max(255);

/**
 * Role ID validation
 */
export const RoleIdSchema = z.string().min(1).max(255);

/**
 * Session ID validation
 */
export const SessionIdSchema = z.string().min(1).max(255);

/**
 * Nigerian phone validation
 */
export const NigerianPhoneSchema = z.string().refine(isValidNigerianPhone, {
  message: 'Invalid Nigerian phone number',
});

/**
 * Email validation
 */
export const EmailSchema = z.string().email();

/**
 * Display name validation
 */
export const DisplayNameSchema = z.string().min(1).max(255);

/**
 * Metadata validation
 */
export const MetadataSchema = z.record(z.unknown()).optional();

/**
 * Create user input validation
 */
export const CreateUserInputSchema = z.object({
  tenantId: TenantIdSchema,
  phone: NigerianPhoneSchema,
  email: EmailSchema.optional(),
  displayName: DisplayNameSchema.optional(),
  roles: z.array(RoleIdSchema).optional(),
  metadata: MetadataSchema,
});

/**
 * Update user input validation
 */
export const UpdateUserInputSchema = z.object({
  email: EmailSchema.optional(),
  displayName: DisplayNameSchema.optional(),
  metadata: MetadataSchema,
});

/**
 * Authenticate input validation
 */
export const AuthenticateInputSchema = z.object({
  tenantId: TenantIdSchema,
  phone: NigerianPhoneSchema,
  credential: z.string().min(1),
});

/**
 * Validate input against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
