"use strict";
/**
 * WebWaka Core Identity Service
 *
 * Provides canonical identity resolution, user profiles, authentication primitives,
 * and tenant-aware session context for the WebWaka platform.
 *
 * Uses Clerk as the Identity Provider - this module is a Clerk adapter + resolver.
 * Authentication happens outside this module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateInputSchema = exports.UpdateUserInputSchema = exports.CreateUserInputSchema = exports.MetadataSchema = exports.DisplayNameSchema = exports.EmailSchema = exports.NigerianPhoneSchema = exports.SessionIdSchema = exports.RoleIdSchema = exports.UserIdSchema = exports.TenantIdSchema = exports.validate = exports.formatNigerianPhone = exports.isValidNigerianPhone = exports.normalizeNigerianPhone = exports.extractTenantContext = exports.clerkUserToProfile = exports.MockClerkAdapter = exports.InMemorySessionStorage = exports.InMemoryUserStorage = exports.IdentityService = void 0;
var identity_service_1 = require("./identity-service");
Object.defineProperty(exports, "IdentityService", { enumerable: true, get: function () { return identity_service_1.IdentityService; } });
var storage_1 = require("./storage");
Object.defineProperty(exports, "InMemoryUserStorage", { enumerable: true, get: function () { return storage_1.InMemoryUserStorage; } });
Object.defineProperty(exports, "InMemorySessionStorage", { enumerable: true, get: function () { return storage_1.InMemorySessionStorage; } });
var clerk_adapter_1 = require("./clerk-adapter");
Object.defineProperty(exports, "MockClerkAdapter", { enumerable: true, get: function () { return clerk_adapter_1.MockClerkAdapter; } });
Object.defineProperty(exports, "clerkUserToProfile", { enumerable: true, get: function () { return clerk_adapter_1.clerkUserToProfile; } });
Object.defineProperty(exports, "extractTenantContext", { enumerable: true, get: function () { return clerk_adapter_1.extractTenantContext; } });
var phone_utils_1 = require("./phone-utils");
Object.defineProperty(exports, "normalizeNigerianPhone", { enumerable: true, get: function () { return phone_utils_1.normalizeNigerianPhone; } });
Object.defineProperty(exports, "isValidNigerianPhone", { enumerable: true, get: function () { return phone_utils_1.isValidNigerianPhone; } });
Object.defineProperty(exports, "formatNigerianPhone", { enumerable: true, get: function () { return phone_utils_1.formatNigerianPhone; } });
var validation_1 = require("./validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validation_1.validate; } });
Object.defineProperty(exports, "TenantIdSchema", { enumerable: true, get: function () { return validation_1.TenantIdSchema; } });
Object.defineProperty(exports, "UserIdSchema", { enumerable: true, get: function () { return validation_1.UserIdSchema; } });
Object.defineProperty(exports, "RoleIdSchema", { enumerable: true, get: function () { return validation_1.RoleIdSchema; } });
Object.defineProperty(exports, "SessionIdSchema", { enumerable: true, get: function () { return validation_1.SessionIdSchema; } });
Object.defineProperty(exports, "NigerianPhoneSchema", { enumerable: true, get: function () { return validation_1.NigerianPhoneSchema; } });
Object.defineProperty(exports, "EmailSchema", { enumerable: true, get: function () { return validation_1.EmailSchema; } });
Object.defineProperty(exports, "DisplayNameSchema", { enumerable: true, get: function () { return validation_1.DisplayNameSchema; } });
Object.defineProperty(exports, "MetadataSchema", { enumerable: true, get: function () { return validation_1.MetadataSchema; } });
Object.defineProperty(exports, "CreateUserInputSchema", { enumerable: true, get: function () { return validation_1.CreateUserInputSchema; } });
Object.defineProperty(exports, "UpdateUserInputSchema", { enumerable: true, get: function () { return validation_1.UpdateUserInputSchema; } });
Object.defineProperty(exports, "AuthenticateInputSchema", { enumerable: true, get: function () { return validation_1.AuthenticateInputSchema; } });
//# sourceMappingURL=index.js.map