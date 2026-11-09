import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PlaylistCuration from './PlaylistCuration';

afterEach(() => {
  cleanup();
});

describe('PlaylistCuration', () => {
  it('shows the update date when it is known', () => {
    const { container } = render(<PlaylistCuration updatedAt="2026-10-28" />);

    expect(container.textContent).toBe('newtronome 큐레이션 · 2026.10.28 업데이트');
    expect(screen.getByText('2026.10.28').getAttribute('datetime')).toBe('2026-10-28');

    const badge = container.querySelector('span[aria-hidden="true"]');
    expect(badge?.className).toContain('bg-black');
    expect(badge?.querySelector('svg')).not.toBeNull();
  });

  it('hides only the date when it is missing or malformed', () => {
    const { container, rerender } = render(<PlaylistCuration />);
    expect(container.textContent).toBe('newtronome 큐레이션');

    rerender(<PlaylistCuration updatedAt="2026/10/28" />);
    expect(container.textContent).toBe('newtronome 큐레이션');
  });
});
