import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBox from './SearchBox';
import { useSettingsStore } from '../stores/useSettingsStore';

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const mockSettings = { customEngines: [], speedDials: [], setSpeedDials: vi.fn() };
    return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
  }),
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

    expect(input.value).toBe('something');
    expect(screen.getByText('YouTube')).toBeTruthy();
  });

  it('calls setSpeedDials with an array (not a function) when adding a suggestion', async () => {
    const existingDials = [{ id: 1, name: 'Google', url: 'https://google.com' }];
    const setSpeedDials = vi.fn();

    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = { customEngines: [], speedDials: existingDials, setSpeedDials };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<SearchBox />);
    const input = screen.getByPlaceholderText(/Let's search something/i);
    fireEvent.change(input, { target: { value: 'git' } });

    // fetchSuggestions registers a JSONP callback in window — invoke it manually
    const cbKey = Object.keys(window).find(
      k => k.startsWith('gsCb_') && typeof window[k] === 'function'
    );
    expect(cbKey).toBeDefined();
    act(() => window[cbKey]([null, ['github.com', 'gitlab.com']]));

    const addBtns = await screen.findAllByTitle('Add to Speed Dial');
    fireEvent.click(addBtns[0]);

    expect(setSpeedDials).toHaveBeenCalledOnce();
    const arg = setSpeedDials.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg).toHaveLength(existingDials.length + 1);
    expect(typeof arg[arg.length - 1].url).toBe('string');
  });
});
