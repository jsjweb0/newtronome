import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ExternalLink from './ExternalLink';

afterEach(() => {
  cleanup();
});

describe('ExternalLink', () => {
  it('always opens in a new tab and announces it', () => {
    render(
      <ExternalLink href="https://soundcloud.com/example" label="SoundCloud에서 열기">
        <img src="logo.webp" alt="" />
      </ExternalLink>
    );

    const link = screen.getByRole('link', { name: 'SoundCloud에서 열기 (새 창)' });

    expect(link.getAttribute('href')).toBe('https://soundcloud.com/example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
