import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let mockTheme = 'nord';

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => selector({ theme: mockTheme })),
}));

const { useThemeEffect } = await import('../useThemeEffect.js');

function getVar(name) {
    return document.documentElement.style.getPropertyValue(name);
}

function cleanStyles() {
    document.documentElement.style.removeProperty('--accent-color');
    document.documentElement.style.removeProperty('--accent-glow');
}

function makeOverlay() {
    const el = document.createElement('div');
    el.id = 'overlay';
    document.body.appendChild(el);
    return el;
}

function removeOverlay() {
    document.getElementById('overlay')?.remove();
}

beforeEach(() => {
    mockTheme = 'nord';
    cleanStyles();
    removeOverlay();
    vi.clearAllMocks();
    vi.useFakeTimers();
});

afterEach(() => {
    cleanStyles();
    removeOverlay();
    vi.useRealTimers();
});

describe('useThemeEffect — static themes', () => {
    it('sets --accent-color from nord theme', () => {
        mockTheme = 'nord';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#88C0D0');
    });

    it('sets --accent-glow from nord theme', () => {
        mockTheme = 'nord';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-glow')).toBe('rgba(136,192,208,0.25)');
    });

    it('sets --accent-color from tokyo theme', () => {
        mockTheme = 'tokyo';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#7aa2f7');
    });

    it('sets --accent-glow from tokyo theme', () => {
        mockTheme = 'tokyo';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-glow')).toBe('rgba(122,162,247,0.25)');
    });

    it('sets --accent-color from sunset theme', () => {
        mockTheme = 'sunset';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#f7768e');
    });

    it('sets --accent-color from forest theme', () => {
        mockTheme = 'forest';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#9ece6a');
    });

    it('does not start an interval for static themes', () => {
        mockTheme = 'nord';
        renderHook(() => useThemeEffect());
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('useThemeEffect — aurora timeBased', () => {
    it('sets morning accent at 8h (5–11h range)', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#FFD26A');
        expect(getVar('--accent-glow')).toBe('rgba(255,210,106,0.2)');
    });

    it('sets afternoon accent at 14h (12–17h range)', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 14, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#FF9F43');
        expect(getVar('--accent-glow')).toBe('rgba(255,159,67,0.2)');
    });

    it('sets evening accent at 19h (18–21h range)', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 19, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#54a0ff');
        expect(getVar('--accent-glow')).toBe('rgba(84,160,255,0.2)');
    });

    it('sets night accent at 23h (22–4h range)', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 23, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#c482fb');
        expect(getVar('--accent-glow')).toBe('rgba(196,130,251,0.25)');
    });

    it('sets night accent at 3am (22–4h range)', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 3, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#c482fb');
    });

    it('sets morning accent at the boundary hour 5h', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 5, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#FFD26A');
    });

    it('sets afternoon accent at the boundary hour 12h', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 12, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#FF9F43');
    });

    it('sets night accent at the boundary hour 22h', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 22, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#c482fb');
    });

    it('starts a 60-second interval', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(vi.getTimerCount()).toBe(1);
    });

    it('updates accent when interval fires across a time boundary', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 11, 59));
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#FFD26A');

        act(() => {
            vi.setSystemTime(new Date(2024, 0, 1, 12, 0));
            vi.advanceTimersByTime(60000);
        });

        expect(getVar('--accent-color')).toBe('#FF9F43');
    });

    it('clears the interval on unmount', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        mockTheme = 'aurora';
        const { unmount } = renderHook(() => useThemeEffect());
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('useThemeEffect — overlay gradient', () => {
    it('sets overlay background when #overlay is present', () => {
        const overlay = makeOverlay();
        mockTheme = 'nord';
        renderHook(() => useThemeEffect());
        expect(overlay.style.background).toContain('linear-gradient');
    });

    it('includes overlayA and overlayB in the gradient', () => {
        const overlay = makeOverlay();
        mockTheme = 'nord';
        renderHook(() => useThemeEffect());
        expect(overlay.style.background).toContain('rgba(0, 0, 0, 0.6)');
        expect(overlay.style.background).toContain('rgba(0, 0, 0, 0.2)');
    });

    it('ends gradient with rgba(0,0,0,0)', () => {
        const overlay = makeOverlay();
        mockTheme = 'tokyo';
        renderHook(() => useThemeEffect());
        expect(overlay.style.background).toContain('rgba(0, 0, 0, 0)');
    });

    it('does not throw when #overlay is absent', () => {
        mockTheme = 'nord';
        expect(() => renderHook(() => useThemeEffect())).not.toThrow();
    });

    it('sets aurora overlay gradient when theme is timeBased', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        const overlay = makeOverlay();
        mockTheme = 'aurora';
        renderHook(() => useThemeEffect());
        expect(overlay.style.background).toContain('linear-gradient');
    });
});

describe('useThemeEffect — unknown theme fallback', () => {
    it('falls back to aurora (timeBased) for unknown theme key', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        mockTheme = 'nonexistent';
        renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#FFD26A');
        expect(vi.getTimerCount()).toBe(1);
    });
});

describe('useThemeEffect — theme change', () => {
    it('updates --accent-color when switching from nord to tokyo', () => {
        mockTheme = 'nord';
        const { rerender } = renderHook(() => useThemeEffect());
        expect(getVar('--accent-color')).toBe('#88C0D0');

        act(() => { mockTheme = 'tokyo'; });
        rerender();
        expect(getVar('--accent-color')).toBe('#7aa2f7');
    });

    it('clears aurora interval when switching to a static theme', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        mockTheme = 'aurora';
        const { rerender } = renderHook(() => useThemeEffect());
        expect(vi.getTimerCount()).toBe(1);

        act(() => { mockTheme = 'nord'; });
        rerender();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('starts interval when switching from static to aurora', () => {
        vi.setSystemTime(new Date(2024, 0, 1, 8, 0));
        mockTheme = 'nord';
        const { rerender } = renderHook(() => useThemeEffect());
        expect(vi.getTimerCount()).toBe(0);

        act(() => { mockTheme = 'aurora'; });
        rerender();
        expect(vi.getTimerCount()).toBe(1);
    });
});
