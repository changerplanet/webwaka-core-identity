/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';
/**
 * Tenant ID validation
 */
export declare const TenantIdSchema: z.ZodString;
/**
 * User ID validation
 */
export declare const UserIdSchema: z.ZodString;
/**
 * Role ID validation
 */
export declare const RoleIdSchema: z.ZodString;
/**
 * Session ID validation
 */
export declare const SessionIdSchema: z.ZodString;
/**
 * Nigerian phone validation
 */
export declare const NigerianPhoneSchema: z.ZodEffects<z.ZodString, string, string>;
/**
 * Email validation
 */
export declare const EmailSchema: z.ZodString;
/**
 * Display name validation
 */
export declare const DisplayNameSchema: z.ZodString;
/**
 * Metadata validation
 */
export declare const MetadataSchema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
/**
 * Create user input validation
 */
export declare const CreateUserInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    phone: z.ZodEffects<z.ZodString, string, string>;
    email: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    phone: string;
    roles?: string[] | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    phone: string;
    roles?: string[] | undefined;
    email?: string | undefined;
    displayName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Update user input validation
 */
export declare const UpdateUserInputSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    displayName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    email?: string | undefined;
    displayName?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Authenticate input validation
 */
export declare const AuthenticateInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    phone: z.ZodEffects<z.ZodString, string, string>;
    credential: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    phone: string;
    credential: string;
}, {
    tenantId: string;
    phone: string;
    credential: string;
}>;
/**
 * Validate input against a schema
 */
export declare function validate<T>(schema: z.ZodSchema<T>, input: unknown): T;
//# sourceMappingURL=validation.d.ts.map