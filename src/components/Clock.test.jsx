import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Clock from './Clock';

// Mock the useSettings hook
vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ clockMode: 'digital', use24hClock: false })
}));

describe('Clock Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Clock />);
    expect(container.querySelector('.clock-row')).toBeTruthy();
  });
});
