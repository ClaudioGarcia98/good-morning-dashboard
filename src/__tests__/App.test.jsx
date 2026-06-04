import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from '../App';

vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

vi.mock('../hooks/useBackgroundLoader', () => ({ useBackgroundLoader: vi.fn() }));
vi.mock('../hooks/useThemeEffect', () => ({ useThemeEffect: vi.fn() }));
vi.mock('../hooks/useFontEffect', () => ({ useFontEffect: vi.fn() }));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (f) => f,
}));

let mockSettings = {
  backgroundUrl: 'bg.jpg',
  backgroundIsVideo: false,
  username: 'TestUser',
  showWeatherWidget: true,
  showQuote: true,
  showSearchBox: true,
  showSpeedDial: true,
  showTop5Anime: true,
  showAnimeSidebar: true,
  showLofiPlayer: true,
};

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
  }),
}));

vi.mock('../components/Greeting', () => ({ default: () => <div data-testid="greeting" /> }));
vi.mock('../components/Clock', () => ({ default: () => <div data-testid="clock" /> }));
vi.mock('../components/SearchBox', () => ({ default: () => <div data-testid="search-box" /> }));
vi.mock('../components/SpeedDial', () => ({ default: () => <div data-testid="speed-dial" /> }));
vi.mock('../components/Quote', () => ({ default: () => <div data-testid="quote" /> }));
vi.mock('../components/WeatherWidget', () => ({ default: () => <div data-testid="weather-widget" /> }));
vi.mock('../components/SettingsPanel/index.jsx', () => ({ default: () => <div data-testid="settings-panel" /> }));
vi.mock('../components/AnimeSchedule/index.jsx', () => ({ default: () => <div data-testid="anime-schedule" /> }));
vi.mock('../components/LofiPlayer', () => ({ default: () => <div data-testid="lofi-player" /> }));

describe('App Orchestrator Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSettings = {
      backgroundUrl: 'bg.jpg',
      backgroundIsVideo: false,
      username: 'TestUser',
      showWeatherWidget: true,
      showQuote: true,
      showSearchBox: true,
      showSpeedDial: true,
      showTop5Anime: true,
      showAnimeSidebar: true,
      showLofiPlayer: true,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders booting screen with username initially', () => {
    render(<App />);
    expect(screen.getByText('Hello, TestUser')).toBeTruthy();
  });

  it('transitions to main UI after boot timeout', () => {
    const { container } = render(<App />);
    expect(container.querySelector('#bootScreen')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(container.querySelector('#bootScreen')).toBeNull();
    expect(screen.getByTestId('greeting')).toBeTruthy();
    expect(screen.getByTestId('clock')).toBeTruthy();
  });

  it('respects visibility settings for child components', () => {
    mockSettings.showWeatherWidget = false;
    mockSettings.showQuote = false;
    
    render(<App />);
    
    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(screen.queryByTestId('weather-widget')).toBeNull();
    expect(screen.queryByTestId('quote')).toBeNull();
  });

  it('manages idle state transitions', () => {
    render(<App />);
    
    act(() => {
      vi.advanceTimersByTime(2800);
    });

    expect(document.documentElement.style.getPropertyValue('--ui-opacity')).toBe('1');
    expect(document.body.classList.contains('idle')).toBe(false);

    act(() => {
      vi.advanceTimersByTime(120000);
    });

    expect(document.documentElement.style.getPropertyValue('--ui-opacity')).toBe('0.2');
    expect(document.body.classList.contains('idle')).toBe(true);

    act(() => {
      fireEvent.mouseMove(window);
    });

    expect(document.documentElement.style.getPropertyValue('--ui-opacity')).toBe('1');
    expect(document.body.classList.contains('idle')).toBe(false);
  });
});
