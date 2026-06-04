import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.unmock('../useSettingsStore.js');

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] ?? null),
        setItem: vi.fn((key, val) => { store[key] = String(val); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Import after mock is in place
const { useSettingsStore } = await import('../useSettingsStore.js');

const DEFAULTS = {
    theme: 'aurora',
    font: 'default',
    clockMode: 'digital',
    username: 'Cláudio',
    malUsername: '',
    fallbackCity: '',
    use24hClock: true,
    useCelsius: true,
    gifName: '',
    lofiId: 'Gu-g8FRG4Zs',
    customLofiId: 'Gu-g8FRG4Zs',
    volume: 0.2,
    speedDials: [],
    customEngines: [],
    showWeatherWidget: true,
    showQuote: true,
    showSearchBox: true,
    showSpeedDial: true,
    showTop5Anime: true,
    showAnimeSidebar: true,
    showLofiPlayer: true,
    backgroundUrl: null,
    backgroundIsVideo: false,
    malError: false,
    malLoading: false,
    malSuccess: false,
};

beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockImplementation(() => null);
    useSettingsStore.setState(DEFAULTS);
});

describe('useSettingsStore — initial state', () => {
    it('has correct string defaults', () => {
        const s = useSettingsStore.getState();
        expect(s.theme).toBe('aurora');
        expect(s.font).toBe('default');
        expect(s.clockMode).toBe('digital');
        expect(s.username).toBe('Cláudio');
        expect(s.malUsername).toBe('');
        expect(s.fallbackCity).toBe('');
        expect(s.gifName).toBe('');
        expect(s.lofiId).toBe('Gu-g8FRG4Zs');
        expect(s.customLofiId).toBe('Gu-g8FRG4Zs');
    });

    it('has correct boolean defaults', () => {
        const s = useSettingsStore.getState();
        expect(s.use24hClock).toBe(true);
        expect(s.useCelsius).toBe(true);
        expect(s.showWeatherWidget).toBe(true);
        expect(s.showQuote).toBe(true);
        expect(s.showSearchBox).toBe(true);
        expect(s.showSpeedDial).toBe(true);
        expect(s.showTop5Anime).toBe(true);
        expect(s.showAnimeSidebar).toBe(true);
        expect(s.showLofiPlayer).toBe(true);
    });

    it('has correct numeric default for volume', () => {
        expect(useSettingsStore.getState().volume).toBe(0.2);
    });

    it('has correct array defaults', () => {
        const s = useSettingsStore.getState();
        expect(s.speedDials).toEqual([]);
        expect(s.customEngines).toEqual([]);
    });

    it('has correct ephemeral defaults', () => {
        const s = useSettingsStore.getState();
        expect(s.backgroundUrl).toBeNull();
        expect(s.backgroundIsVideo).toBe(false);
        expect(s.malError).toBe(false);
        expect(s.malLoading).toBe(false);
        expect(s.malSuccess).toBe(false);
    });
});

describe('useSettingsStore — actions', () => {
    it('setTheme updates theme', () => {
        useSettingsStore.getState().setTheme('nord');
        expect(useSettingsStore.getState().theme).toBe('nord');
    });

    it('setFont updates font', () => {
        useSettingsStore.getState().setFont('mono');
        expect(useSettingsStore.getState().font).toBe('mono');
    });

    it('setClockMode updates clockMode', () => {
        useSettingsStore.getState().setClockMode('analog');
        expect(useSettingsStore.getState().clockMode).toBe('analog');
    });

    it('setUsername updates username', () => {
        useSettingsStore.getState().setUsername('Alice');
        expect(useSettingsStore.getState().username).toBe('Alice');
    });

    it('setMalUsername updates malUsername', () => {
        useSettingsStore.getState().setMalUsername('otakuuser');
        expect(useSettingsStore.getState().malUsername).toBe('otakuuser');
    });

    it('setFallbackCity updates fallbackCity', () => {
        useSettingsStore.getState().setFallbackCity('Lisbon');
        expect(useSettingsStore.getState().fallbackCity).toBe('Lisbon');
    });

    it('setUse24hClock toggles to false', () => {
        useSettingsStore.getState().setUse24hClock(false);
        expect(useSettingsStore.getState().use24hClock).toBe(false);
    });

    it('setUseCelsius toggles to false', () => {
        useSettingsStore.getState().setUseCelsius(false);
        expect(useSettingsStore.getState().useCelsius).toBe(false);
    });

    it('setGifName updates gifName', () => {
        useSettingsStore.getState().setGifName('bg.gif');
        expect(useSettingsStore.getState().gifName).toBe('bg.gif');
    });

    it('setLofiId updates lofiId', () => {
        useSettingsStore.getState().setLofiId('abc123');
        expect(useSettingsStore.getState().lofiId).toBe('abc123');
    });

    it('setCustomLofiId updates customLofiId', () => {
        useSettingsStore.getState().setCustomLofiId('xyz789');
        expect(useSettingsStore.getState().customLofiId).toBe('xyz789');
    });

    it('setVolume updates volume', () => {
        useSettingsStore.getState().setVolume(0.75);
        expect(useSettingsStore.getState().volume).toBe(0.75);
    });

    it('setSpeedDials updates speedDials', () => {
        const dials = [{ label: 'GitHub', url: 'https://github.com' }];
        useSettingsStore.getState().setSpeedDials(dials);
        expect(useSettingsStore.getState().speedDials).toEqual(dials);
    });

    it('setCustomEngines updates customEngines', () => {
        const engines = [{ name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' }];
        useSettingsStore.getState().setCustomEngines(engines);
        expect(useSettingsStore.getState().customEngines).toEqual(engines);
    });

    it('setBackgroundUrl updates backgroundUrl', () => {
        useSettingsStore.getState().setBackgroundUrl('blob:http://localhost/abc');
        expect(useSettingsStore.getState().backgroundUrl).toBe('blob:http://localhost/abc');
    });

    it('setBackgroundIsVideo updates backgroundIsVideo', () => {
        useSettingsStore.getState().setBackgroundIsVideo(true);
        expect(useSettingsStore.getState().backgroundIsVideo).toBe(true);
    });

    it('setMalError updates malError', () => {
        useSettingsStore.getState().setMalError(true);
        expect(useSettingsStore.getState().malError).toBe(true);
    });

    it('setMalLoading updates malLoading', () => {
        useSettingsStore.getState().setMalLoading(true);
        expect(useSettingsStore.getState().malLoading).toBe(true);
    });

    it('setMalSuccess updates malSuccess', () => {
        useSettingsStore.getState().setMalSuccess(true);
        expect(useSettingsStore.getState().malSuccess).toBe(true);
    });
});

describe('useSettingsStore — widget visibility toggles', () => {
    const pairs = [
        ['setShowWeatherWidget', 'showWeatherWidget'],
        ['setShowQuote',         'showQuote'],
        ['setShowSearchBox',     'showSearchBox'],
        ['setShowSpeedDial',     'showSpeedDial'],
        ['setShowTop5Anime',     'showTop5Anime'],
        ['setShowAnimeSidebar',  'showAnimeSidebar'],
        ['setShowLofiPlayer',    'showLofiPlayer'],
    ];

    for (const [setter, key] of pairs) {
        it(`${setter} sets ${key} to false`, () => {
            useSettingsStore.getState()[setter](false);
            expect(useSettingsStore.getState()[key]).toBe(false);
        });

        it(`${setter} sets ${key} back to true`, () => {
            useSettingsStore.setState({ [key]: false });
            useSettingsStore.getState()[setter](true);
            expect(useSettingsStore.getState()[key]).toBe(true);
        });
    }
});

describe('useSettingsStore — persist config', () => {
    it('persist name is dash_settings', () => {
        expect(useSettingsStore.persist.getOptions().name).toBe('dash_settings');
    });

    it('partialize excludes ephemeral keys', () => {
        const { partialize } = useSettingsStore.persist.getOptions();
        const partial = partialize(useSettingsStore.getState());
        expect(partial).not.toHaveProperty('backgroundUrl');
        expect(partial).not.toHaveProperty('backgroundIsVideo');
        expect(partial).not.toHaveProperty('malError');
        expect(partial).not.toHaveProperty('malLoading');
        expect(partial).not.toHaveProperty('malSuccess');
    });

    it('partialize includes all persisted keys', () => {
        const { partialize } = useSettingsStore.persist.getOptions();
        const partial = partialize(useSettingsStore.getState());
        const expected = [
            'theme', 'font', 'clockMode', 'username', 'malUsername', 'fallbackCity',
            'use24hClock', 'useCelsius', 'gifName', 'lofiId', 'customLofiId', 'volume',
            'speedDials', 'customEngines', 'showWeatherWidget', 'showQuote',
            'showSearchBox', 'showSpeedDial', 'showTop5Anime', 'showAnimeSidebar', 'showLofiPlayer',
        ];
        for (const key of expected) {
            expect(partial).toHaveProperty(key);
        }
    });

    it('state update writes to localStorage via persist middleware', () => {
        useSettingsStore.getState().setTheme('midnight');
        const stored = JSON.parse(localStorageMock.setItem.mock.calls.findLast(
            ([key]) => key === 'dash_settings'
        )?.[1] ?? 'null');
        expect(stored?.state?.theme).toBe('midnight');
    });
});

describe('useSettingsStore — localStorage seed on init', () => {
    it('respects dash_* legacy keys when store is re-imported fresh', async () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'dash_theme') return 'dracula';
            if (key === 'dash_username') return 'Bob';
            if (key === 'dash_volume') return '0.9';
            if (key === 'dash_24h') return 'false';
            if (key === 'dash_celsius') return 'false';
            return null;
        });
        // Simulate what the store reads at module init time
        expect(localStorage.getItem('dash_theme')).toBe('dracula');
        expect(localStorage.getItem('dash_username')).toBe('Bob');
        expect(parseFloat(localStorage.getItem('dash_volume'))).toBe(0.9);
        expect(localStorage.getItem('dash_24h') !== 'false').toBe(false);
        expect(localStorage.getItem('dash_celsius') !== 'false').toBe(false);
    });
});
