import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpeedDial from './SpeedDial';

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        const state = {
            speedDials: [{ id: 1, name: 'Google', url: 'https://google.com' }],
            setSpeedDials: vi.fn(),
        };
        return typeof selector === 'function' ? selector(state) : state;
    },
}));

describe('SpeedDial', () => {
    it('renders configured speed dials', () => {
        render(<SpeedDial />);
        expect(screen.getByLabelText('Google')).toBeTruthy();
    });
});
