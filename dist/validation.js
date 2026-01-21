"use strict";
/**
 * Input validation schemas using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateInputSchema = exports.UpdateUserInputSchema = exports.CreateUserInputSchema = exports.MetadataSchema = exports.DisplayNameSchema = exports.EmailSchema = exports.NigerianPhoneSchema = exports.SessionIdSchema = exports.RoleIdSchema = exports.UserIdSchema = exports.TenantIdSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
const phone_utils_1 = require("./phone-utils");
/**
 * Tenant ID validation
 */
exports.TenantIdSchema = zod_1.z.string().min(1).max(255);
/**
 * User ID validation
 */
exports.UserIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Role ID validation
 */
exports.RoleIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Session ID validation
 */
exports.SessionIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Nigerian phone validation
 */
exports.NigerianPhoneSchema = zod_1.z.string().refine(phone_utils_1.isValidNigerianPhone, {
    message: 'Invalid Nigerian phone number',
});
/**
 * Email validation
 */
exports.EmailSchema = zod_1.z.string().email();
/**
 * Display name validation
 */
exports.DisplayNameSchema = zod_1.z.string().min(1).max(255);
/**
 * Metadata validation
 */
exports.MetadataSchema = zod_1.z.record(zod_1.z.unknown()).optional();
/**
 * Create user input validation
 */
exports.CreateUserInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    phone: exports.NigerianPhoneSchema,
    email: exports.EmailSchema.optional(),
    displayName: exports.DisplayNameSchema.optional(),
    roles: zod_1.z.array(exports.RoleIdSchema).optional(),
    metadata: exports.MetadataSchema,
});
/**
 * Update user input validation
 */
exports.UpdateUserInputSchema = zod_1.z.object({
    email: exports.EmailSchema.optional(),
    displayName: exports.DisplayNameSchema.optional(),
    metadata: exports.MetadataSchema,
});
/**
 * Authenticate input validation
 */
exports.AuthenticateInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    phone: exports.NigerianPhoneSchema,
    credential: zod_1.z.string().min(1),
});
/**
 * Validate input against a schema
 */
function validate(schema, input) {
    return schema.parse(input);
}
//# sourceMappingURL=validation.js.map