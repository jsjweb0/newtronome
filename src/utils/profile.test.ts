import { describe, expect, it } from 'vitest';
import { validateProfile } from './profile';

describe('프로필 닉네임 길이', () => {
  it.each(['가'.repeat(8), '😀'.repeat(8)])('8자 닉네임을 허용한다', (nickname) => {
    expect(validateProfile({ nickname, photoURL: '' }).isValid).toBe(true);
  });
  it.each(['가'.repeat(9), '😀'.repeat(9), ' \n\t '])('길이 초과·공백 닉네임을 거부한다', (nickname) => {
    expect(validateProfile({ nickname, photoURL: '' }).errors.nickname).toBeTruthy();
  });
});
