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
import { NigerianPhone } from './types';
/**
 * Normalize a Nigerian phone number to E.164 format
 * @param input Raw phone number input
 * @returns Normalized phone number in E.164 format
 * @throws Error if the input is not a valid Nigerian phone number
 */
export declare function normalizeNigerianPhone(input: string): NigerianPhone;
/**
 * Validate if a string is a valid Nigerian phone number
 * @param input Phone number to validate
 * @returns true if valid, false otherwise
 */
export declare function isValidNigerianPhone(input: string): boolean;
/**
 * Format a Nigerian phone number for display
 * @param phone Phone number in E.164 format
 * @returns Formatted phone number (e.g., +234 801 234 5678)
 */
export declare function formatNigerianPhone(phone: NigerianPhone): string;
//# sourceMappingURL=phone-utils.d.ts.map