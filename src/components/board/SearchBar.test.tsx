import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from './SearchBar';

afterEach(() => {
  cleanup();
});

describe('SearchBar accessibility', () => {
  it('connects a visible-to-screen-readers label to the search input', () => {
    render(<SearchBar searchKeyword="" setSearchKeyword={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: '검색어' });
    expect(input.getAttribute('id')).toBe('board-search');
  });
});
