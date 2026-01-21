"use strict";
/**
 * Nigerian phone number normalization utilities
 *
 * Nigerian phone numbers follow these patterns:
 * - 11 digits starting with 0 (e.g., 08012345678)
 * - 10 digits without leading 0 (e.g., 8012345678)
 * - E.164 format with +234 (e.g., +2348012345678)
 *
 * All numbers are normalized to E.164 format (+234...)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeNigerianPhone = normalizeNigerianPhone;
exports.isValidNigerianPhone = isValidNigerianPhone;
exports.formatNigerianPhone = formatNigerianPhone;
/**
 * Normalize a Nigerian phone number to E.164 format
 * @param input Raw phone number input
 * @returns Normalized phone number in E.164 format
 * @throws Error if the input is not a valid Nigerian phone number
 */
function normalizeNigerianPhone(input) {
    // Remove all whitespace and special characters
    const cleaned = input.replace(/[\s\-\(\)\.]/g, '');
    // Pattern 1: Already in E.164 format (+234...)
    if (cleaned.startsWith('+234')) {
        const digits = cleaned.substring(4);
        if (digits.length === 10 && /^\d{10}$/.test(digits)) {
            return cleaned;
        }
        throw new Error(`Invalid Nigerian phone number: ${input}`);
    }
    // Pattern 2: Starts with 234 (without +)
    if (cleaned.startsWith('234')) {
        const digits = cleaned.substring(3);
        if (digits.length === 10 && /^\d{10}$/.test(digits)) {
            return `+${cleaned}`;
        }
        throw new Error(`Invalid Nigerian phone number: ${input}`);
    }
    // Pattern 3: 11 digits starting with 0
    if (cleaned.startsWith('0') && cleaned.length === 11 && /^\d{11}$/.test(cleaned)) {
        const digits = cleaned.substring(1); // Remove leading 0
        return `+234${digits}`;
    }
    // Pattern 4: 10 digits without leading 0
    if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
        return `+234${cleaned}`;
    }
    throw new Error(`Invalid Nigerian phone number: ${input}`);
}
/**
 * Validate if a string is a valid Nigerian phone number
 * @param input Phone number to validate
 * @returns true if valid, false otherwise
 */
function isValidNigerianPhone(input) {
    try {
        normalizeNigerianPhone(input);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Format a Nigerian phone number for display
 * @param phone Phone number in E.164 format
 * @returns Formatted phone number (e.g., +234 801 234 5678)
 */
function formatNigerianPhone(phone) {
    if (!phone.startsWith('+234') || phone.length !== 14) {
        throw new Error(`Invalid E.164 Nigerian phone number: ${phone}`);
    }
    const digits = phone.substring(4); // Remove +234
    return `+234 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
}
//# sourceMappingURL=phone-utils.js.map