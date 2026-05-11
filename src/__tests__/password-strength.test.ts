import { describe, expect, it } from 'vitest';
import { getRequirements, getStrength } from '../../app/components/PasswordStrengthIndicator';

describe('password strength requirements', () => {
  it('requires a special character for strong passwords', () => {
    expect(getRequirements('Password123').hasSpecial).toBe(false);
    expect(Object.values(getRequirements('Password123!')).every(Boolean)).toBe(true);
  });

  it('only marks passwords as strong when every requirement is met', () => {
    expect(getStrength('Password123')).toEqual({ level: 'good', score: 3 });
    expect(getStrength('Password123!')).toEqual({ level: 'strong', score: 4 });
  });
});
