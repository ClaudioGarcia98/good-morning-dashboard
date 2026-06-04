import { describe, it, expect } from 'vitest';
import { THEMES, FONTS } from '../settingsConstants.js';

describe('THEMES', () => {
    it('exports an object', () => {
        expect(typeof THEMES).toBe('object');
        expect(THEMES).not.toBeNull();
    });

    it('contains the expected theme keys', () => {
        expect(Object.keys(THEMES)).toEqual(['aurora', 'nord', 'tokyo', 'sunset', 'forest']);
    });

    it('every non-aurora theme has accent, glow, overlayA, overlayB', () => {
        const staticThemes = Object.entries(THEMES).filter(([key]) => key !== 'aurora');
        for (const [name, theme] of staticThemes) {
            expect(theme, name).toHaveProperty('accent');
            expect(theme, name).toHaveProperty('glow');
            expect(theme, name).toHaveProperty('overlayA');
            expect(theme, name).toHaveProperty('overlayB');
        }
    });

    it('aurora is flagged timeBased and has overlayA, overlayB but no accent/glow', () => {
        expect(THEMES.aurora.timeBased).toBe(true);
        expect(THEMES.aurora).toHaveProperty('overlayA');
        expect(THEMES.aurora).toHaveProperty('overlayB');
        expect(THEMES.aurora).not.toHaveProperty('accent');
        expect(THEMES.aurora).not.toHaveProperty('glow');
    });

    it('overlay values are rgba strings', () => {
        for (const [name, theme] of Object.entries(THEMES)) {
            expect(theme.overlayA, `${name}.overlayA`).toMatch(/^rgba\(/);
            expect(theme.overlayB, `${name}.overlayB`).toMatch(/^rgba\(/);
        }
    });

    it('static theme accent values are hex color strings', () => {
        const staticThemes = Object.entries(THEMES).filter(([key]) => key !== 'aurora');
        for (const [name, theme] of staticThemes) {
            expect(theme.accent, `${name}.accent`).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
    });

    it('static theme glow values are rgba strings', () => {
        const staticThemes = Object.entries(THEMES).filter(([key]) => key !== 'aurora');
        for (const [name, theme] of staticThemes) {
            expect(theme.glow, `${name}.glow`).toMatch(/^rgba\(/);
        }
    });
});

describe('FONTS', () => {
    it('exports an object', () => {
        expect(typeof FONTS).toBe('object');
        expect(FONTS).not.toBeNull();
    });

    it('contains the expected font keys', () => {
        expect(Object.keys(FONTS)).toEqual(['default', 'raleway', 'outfit', 'nunito', 'jetbrains', 'playfair']);
    });

    it('every font entry has family and url', () => {
        for (const [name, font] of Object.entries(FONTS)) {
            expect(font, name).toHaveProperty('family');
            expect(font, name).toHaveProperty('url');
        }
    });

    it('every family is a non-empty string', () => {
        for (const [name, font] of Object.entries(FONTS)) {
            expect(typeof font.family, `${name}.family`).toBe('string');
            expect(font.family.length, `${name}.family`).toBeGreaterThan(0);
        }
    });

    it('default font has null url', () => {
        expect(FONTS.default.url).toBeNull();
    });

    it('non-default fonts have Google Fonts urls', () => {
        const webFonts = Object.entries(FONTS).filter(([key]) => key !== 'default');
        for (const [name, font] of webFonts) {
            expect(typeof font.url, `${name}.url`).toBe('string');
            expect(font.url, `${name}.url`).toMatch(/^https:\/\/fonts\.googleapis\.com\//);
        }
    });
});
