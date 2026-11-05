import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ImageSlider from './Slider';

vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('swiper/modules', () => ({
  A11y: {},
  Autoplay: {},
  EffectCoverflow: {},
  Keyboard: {},
}));
vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/effect-coverflow', () => ({}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ImageSlider reduced motion', () => {
  it('does not autoplay when reduced motion is preferred', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<ImageSlider images={['/first.jpg', '/second.jpg']} />);

    expect(
      screen.getByRole('button', { name: '슬라이드 자동 재생 시작' })
    ).toBeTruthy();
  });
});
