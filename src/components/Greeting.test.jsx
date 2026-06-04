import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Greeting from './Greeting';

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        const state = { username: 'Claudio' };
        return typeof selector === 'function' ? selector(state) : state;
    },
}));

describe('Greeting Component', () => {
    it('renders the username correctly', () => {
        render(<Greeting />);
        expect(screen.getByText(/Claudio/i)).toBeTruthy();
    });
});
