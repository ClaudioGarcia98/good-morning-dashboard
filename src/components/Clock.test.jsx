import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Clock from './Clock';

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const mockSettings = { clockMode: 'digital', use24hClock: false };
    return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
  }),
}));

describe('Clock Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Clock />);
    expect(container.querySelector('.clock-row')).toBeTruthy();
  });
});
