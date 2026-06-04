import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let mockFont = 'default';

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => selector({ font: mockFont })),
}));

const { useFontEffect } = await import('../useFontEffect.js');

function cleanHead() {
    document.head.querySelectorAll('link[id^="gf-"]').forEach((el) => el.remove());
    document.documentElement.style.removeProperty('--font-family');
}

beforeEach(() => {
    mockFont = 'default';
    cleanHead();
    vi.clearAllMocks();
});

afterEach(() => {
    cleanHead();
});

describe('useFontEffect — default font (no URL)', () => {
    it('sets --font-family to the default stack', () => {
        mockFont = 'default';
        renderHook(() => useFontEffect());
        expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
            "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"
        );
    });

    it('does not append a <link> tag for the default font', () => {
        mockFont = 'default';
        renderHook(() => useFontEffect());
        expect(document.getElementById('gf-default')).toBeNull();
    });
});

describe('useFontEffect — font with URL', () => {
    it('appends a <link> tag with the correct id', () => {
        mockFont = 'raleway';
        renderHook(() => useFontEffect());
        expect(document.getElementById('gf-raleway')).not.toBeNull();
    });

    it('sets rel="stylesheet" on the appended link', () => {
        mockFont = 'outfit';
        renderHook(() => useFontEffect());
        expect(document.getElementById('gf-outfit').rel).toBe('stylesheet');
    });

    it('sets href to the Google Fonts URL', () => {
        mockFont = 'nunito';
        renderHook(() => useFontEffect());
        expect(document.getElementById('gf-nunito').href).toContain('Nunito');
    });

    it('sets --font-family to the selected font stack', () => {
        mockFont = 'jetbrains';
        renderHook(() => useFontEffect());
        expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
            "'JetBrains Mono',monospace"
        );
    });
});

describe('useFontEffect — deduplication', () => {
    it('does not append a second <link> if one already exists', () => {
        mockFont = 'playfair';
        renderHook(() => useFontEffect());
        renderHook(() => useFontEffect());
        expect(document.head.querySelectorAll('#gf-playfair')).toHaveLength(1);
    });
});

describe('useFontEffect — unknown font key fallback', () => {
    it('falls back to default family when font key is not in FONTS', () => {
        mockFont = 'nonexistent';
        renderHook(() => useFontEffect());
        expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
            "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"
        );
    });

    it('does not append a link for an unknown font key', () => {
        mockFont = 'nonexistent';
        renderHook(() => useFontEffect());
        expect(document.getElementById('gf-nonexistent')).toBeNull();
    });
});

describe('useFontEffect — font change', () => {
    it('updates --font-family when the font selection changes', () => {
        mockFont = 'raleway';
        const { rerender } = renderHook(() => useFontEffect());
        expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
            "'Raleway',sans-serif"
        );

        act(() => { mockFont = 'outfit'; });
        rerender();
        expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
            "'Outfit',sans-serif"
        );
    });

    it('appends a new link tag for each newly selected font', () => {
        mockFont = 'raleway';
        const { rerender } = renderHook(() => useFontEffect());
        act(() => { mockFont = 'nunito'; });
        rerender();
        expect(document.getElementById('gf-raleway')).not.toBeNull();
        expect(document.getElementById('gf-nunito')).not.toBeNull();
    });
});

describe('useFontEffect — unmount behaviour', () => {
    it('does not remove the <link> tag on unmount', () => {
        mockFont = 'outfit';
        const { unmount } = renderHook(() => useFontEffect());
        unmount();
        expect(document.getElementById('gf-outfit')).not.toBeNull();
    });

    it('leaves --font-family set on unmount', () => {
        mockFont = 'raleway';
        const { unmount } = renderHook(() => useFontEffect());
        unmount();
        expect(document.documentElement.style.getPropertyValue('--font-family')).toBe(
            "'Raleway',sans-serif"
        );
    });
});
