import { normalizeNigerianPhone, isValidNigerianPhone, formatNigerianPhone } from './phone-utils';

describe('normalizeNigerianPhone', () => {
  it('should normalize 11-digit number starting with 0', () => {
    expect(normalizeNigerianPhone('08012345678')).toBe('+2348012345678');
  });

  it('should normalize 10-digit number without leading 0', () => {
    expect(normalizeNigerianPhone('8012345678')).toBe('+2348012345678');
  });

  it('should accept already normalized E.164 format', () => {
    expect(normalizeNigerianPhone('+2348012345678')).toBe('+2348012345678');
  });

  it('should normalize number starting with 234', () => {
    expect(normalizeNigerianPhone('2348012345678')).toBe('+2348012345678');
  });

  it('should handle numbers with spaces and special characters', () => {
    expect(normalizeNigerianPhone('0801 234 5678')).toBe('+2348012345678');
    expect(normalizeNigerianPhone('(0801) 234-5678')).toBe('+2348012345678');
    expect(normalizeNigerianPhone('+234 801 234 5678')).toBe('+2348012345678');
  });

  it('should throw error for invalid numbers', () => {
    expect(() => normalizeNigerianPhone('123')).toThrow();
    expect(() => normalizeNigerianPhone('08012345')).toThrow();
    expect(() => normalizeNigerianPhone('+1234567890')).toThrow();
    expect(() => normalizeNigerianPhone('abc')).toThrow();
  });
});

describe('isValidNigerianPhone', () => {
  it('should return true for valid numbers', () => {
    expect(isValidNigerianPhone('08012345678')).toBe(true);
    expect(isValidNigerianPhone('8012345678')).toBe(true);
    expect(isValidNigerianPhone('+2348012345678')).toBe(true);
  });

  it('should return false for invalid numbers', () => {
    expect(isValidNigerianPhone('123')).toBe(false);
    expect(isValidNigerianPhone('abc')).toBe(false);
    expect(isValidNigerianPhone('+1234567890')).toBe(false);
  });
});

describe('formatNigerianPhone', () => {
  it('should format E.164 number for display', () => {
    expect(formatNigerianPhone('+2348012345678')).toBe('+234 801 234 5678');
  });

  it('should throw error for invalid E.164 format', () => {
    expect(() => formatNigerianPhone('08012345678' as any)).toThrow();
    expect(() => formatNigerianPhone('+234801234567' as any)).toThrow();
  });
});
