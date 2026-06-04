import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../stores/useSettingsStore';

// Reset the in-memory store state between tests so they don't bleed into each other
beforeEach(() => {
    useSettingsStore.setState({
        username: 'Cláudio',
        theme: 'aurora',
        volume: 0.2,
    });
});

describe('useSettingsStore', () => {
    it('has default username', () => {
        expect(useSettingsStore.getState().username).toBe('Cláudio');
    });

    it('setUsername updates state', () => {
        useSettingsStore.getState().setUsername('TestUser');
        expect(useSettingsStore.getState().username).toBe('TestUser');
    });

    it('setTheme updates state', () => {
        useSettingsStore.getState().setTheme('nord');
        expect(useSettingsStore.getState().theme).toBe('nord');
    });

    it('setVolume updates state', () => {
        useSettingsStore.getState().setVolume(0.8);
        expect(useSettingsStore.getState().volume).toBe(0.8);
    });
});
