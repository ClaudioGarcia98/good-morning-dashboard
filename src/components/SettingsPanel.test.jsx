import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsPanel from './SettingsPanel/index.jsx';

const spState = {
    theme: 'aurora', setTheme: vi.fn(),
    font: 'default', setFont: vi.fn(),
    clockMode: 'digital', setClockMode: vi.fn(),
    username: 'TestUser', setUsername: vi.fn(),
    malUsername: '', setMalUsername: vi.fn(),
    malError: false, malLoading: false, malSuccess: false,
    setMalError: vi.fn(), setMalLoading: vi.fn(), setMalSuccess: vi.fn(),
    speedDials: [], setSpeedDials: vi.fn(),
    volume: 0.5, setVolume: vi.fn(),
    gifName: '', setGifName: vi.fn(),
    setBackgroundUrl: vi.fn(), setBackgroundIsVideo: vi.fn(),
    use24hClock: true, setUse24hClock: vi.fn(),
    useCelsius: true, setUseCelsius: vi.fn(),
    fallbackCity: '', setFallbackCity: vi.fn(),
    lofiId: 'Gu-g8FRG4Zs', setLofiId: vi.fn(),
    lofiStations: [{ id: 1, videoId: 'Gu-g8FRG4Zs', name: 'Anime Lofi' }],
    setLofiStations: vi.fn(),
    showWeatherWidget: true, setShowWeatherWidget: vi.fn(),
    showQuote: true, setShowQuote: vi.fn(),
    showSearchBox: true, setShowSearchBox: vi.fn(),
    showSpeedDial: true, setShowSpeedDial: vi.fn(),
    showTop5Anime: true, setShowTop5Anime: vi.fn(),
    showAnimeSidebar: true, setShowAnimeSidebar: vi.fn(),
    showLofiPlayer: true, setShowLofiPlayer: vi.fn(),
};

vi.mock('../stores/useSettingsStore', () => {
    const useSettingsStore = vi.fn((selector) =>
        typeof selector === 'function' ? selector(spState) : spState
    );
    useSettingsStore.getState = vi.fn(() => spState);
    return { useSettingsStore };
});

describe('SettingsPanel', () => {
    it('opens panel when toggle is clicked', () => {
        const { container } = render(<SettingsPanel />);
        const toggle = container.querySelector('#settingsToggle');
        fireEvent.click(toggle);
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(true);
    });
});
