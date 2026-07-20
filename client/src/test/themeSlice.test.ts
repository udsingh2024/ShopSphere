import { describe, test, expect, beforeEach, vi } from 'vitest';
import themeReducer, { toggleTheme, setTheme } from '../store/themeSlice';

describe('Theme Redux Slice', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock document.documentElement class mutations
    document.documentElement.classList.add = vi.fn();
    document.documentElement.classList.remove = vi.fn();
  });

  test('should return the initial state', () => {
    const state = themeReducer(undefined, { type: 'unknown' });
    expect(state.theme).toBeDefined();
  });

  test('should handle setTheme to light', () => {
    const state = themeReducer(undefined, setTheme('light'));
    expect(state.theme).toBe('light');
    expect(localStorage.getItem('shopsphere_theme')).toBe('light');
  });

  test('should handle toggleTheme', () => {
    const initialState = { theme: 'dark' as const };
    let state = themeReducer(initialState, toggleTheme());
    expect(state.theme).toBe('light');
    expect(localStorage.getItem('shopsphere_theme')).toBe('light');

    state = themeReducer(state, toggleTheme());
    expect(state.theme).toBe('dark');
    expect(localStorage.getItem('shopsphere_theme')).toBe('dark');
  });
});
