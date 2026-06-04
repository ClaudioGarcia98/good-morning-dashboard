import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsPanel from './SettingsPanel';

vi.mock('../context/useSettings', () => ({
  useSettings: () => ({
    theme: 'aurora', setTheme: vi.fn(), THEMES: { aurora: { accent: '#fff' } },
    font: 'default', setFont: vi.fn(), FONTS: { default: { family: 'sans' } },
    clockMode: 'digital', setClockMode: vi.fn(),
    username: 'TestUser', setUsername: vi.fn(),
    malUsername: '', setMalUsername: vi.fn(),
    speedDials: [], setSpeedDials: vi.fn(),
    volume: 0.5, setVolume: vi.fn(),
    use24hClock: true, setUse24hClock: vi.fn(),
    useCelsius: true, setUseCelsius: vi.fn(),
    showWeatherWidget: true, setShowWeatherWidget: vi.fn(),
    showQuote: true, setShowQuote: vi.fn(),
    showSearchBox: true, setShowSearchBox: vi.fn(),
    showSpeedDial: true, setShowSpeedDial: vi.fn(),
    showTop5Anime: true, setShowTop5Anime: vi.fn(),
    showAnimeSidebar: true, setShowAnimeSidebar: vi.fn(),
    showLofiPlayer: true, setShowLofiPlayer: vi.fn()
  })
}));

describe('SettingsPanel', () => {
  it('opens panel when toggle is clicked', () => {
    const { container } = render(<SettingsPanel />);
    const toggle = container.querySelector('#settingsToggle');
    fireEvent.click(toggle);
    expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(true);
  });
});
