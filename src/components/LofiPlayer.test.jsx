import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LofiPlayer from './LofiPlayer';

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        const state = {
            volume: 0.5,
            lofiId: 'testVideoId',
            customLofiId: 'testVideoId',
            setLofiId: vi.fn(),
        };
        return typeof selector === 'function' ? selector(state) : state;
    },
}));

describe('LofiPlayer', () => {
    it('renders the iframe with correct video id', () => {
        const { container } = render(<LofiPlayer />);
        const iframe = container.querySelector('iframe');
        expect(iframe.src).toContain('testVideoId');
    });
});
