import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBox from './SearchBox';

vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ customEngines: [], setSpeedDials: vi.fn() })
}));

describe('SearchBox', () => {
  it('updates query on input', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Let's search something/i);
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });

  it('detects engine prefix', () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Let's search something/i);
    fireEvent.change(input, { target: { value: 'yt something' } });
    
    // It should strip the prefix and display the engine name in the badge
    expect(input.value).toBe('something');
    expect(screen.getByText('YouTube')).toBeTruthy();
  });
});
