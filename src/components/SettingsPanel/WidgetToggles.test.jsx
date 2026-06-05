import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WidgetToggles from './WidgetToggles';

let mockState;

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) =>
        typeof selector === 'function' ? selector(mockState) : mockState,
}));

beforeEach(() => {
    mockState = {
        showWeatherWidget: true, setShowWeatherWidget: vi.fn(),
        showQuote:         true, setShowQuote:         vi.fn(),
        showSearchBox:     true, setShowSearchBox:     vi.fn(),
        showSpeedDial:     true, setShowSpeedDial:     vi.fn(),
        showTop5Anime:     true, setShowTop5Anime:     vi.fn(),
        showAnimeSidebar:  true, setShowAnimeSidebar:  vi.fn(),
        showLofiPlayer:    true, setShowLofiPlayer:    vi.fn(),
        lofiStations: [{ id: 1, videoId: 'abc', name: 'Test' }],
    };
});

describe('WidgetToggles', () => {
    it('renders all 7 widget rows', () => {
        const { container } = render(<WidgetToggles />);
        const rows = container.querySelectorAll('[style*="justify-content: space-between"]');
        expect(rows.length).toBe(7);
    });

    it('renders Lofi Player row when stations is empty', () => {
        mockState.lofiStations = [];
        const { getByText } = render(<WidgetToggles />);
        expect(getByText('Lofi Player')).toBeTruthy();
    });

    it('"Show" for Lofi Player is disabled when lofiStations is empty', () => {
        mockState.lofiStations = [];
        const { getByText } = render(<WidgetToggles />);
        const lofiRow = getByText('Lofi Player').closest('div[style]');
        const showBtn = [...lofiRow.querySelectorAll('button')].find(b => b.textContent === 'Show');
        expect(showBtn.disabled).toBe(true);
    });

    it('"Show" for Lofi Player is enabled when stations exist', () => {
        const { getByText } = render(<WidgetToggles />);
        const lofiRow = getByText('Lofi Player').closest('div[style]');
        const showBtn = [...lofiRow.querySelectorAll('button')].find(b => b.textContent === 'Show');
        expect(showBtn.disabled).toBe(false);
    });

    it('clicking disabled "Show" for Lofi Player does not call setter', () => {
        mockState.lofiStations = [];
        const { getByText } = render(<WidgetToggles />);
        const lofiRow = getByText('Lofi Player').closest('div[style]');
        const showBtn = [...lofiRow.querySelectorAll('button')].find(b => b.textContent === 'Show');
        fireEvent.click(showBtn);
        expect(mockState.setShowLofiPlayer).not.toHaveBeenCalledWith(true);
    });

    it('"Hide" is active and "Show" is inactive for Lofi Player when no stations', () => {
        mockState.lofiStations = [];
        mockState.showLofiPlayer = true; // stored as true, but effectively hidden
        const { getByText } = render(<WidgetToggles />);
        const lofiRow = getByText('Lofi Player').closest('div[style]');
        const [hideBtn, showBtn] = lofiRow.querySelectorAll('button');
        expect(hideBtn.className).toContain('active');
        expect(showBtn.className).not.toContain('active');
    });

    it('"Show" calls setter with true when stations exist', () => {
        mockState.showLofiPlayer = false;
        const { getByText } = render(<WidgetToggles />);
        const lofiRow = getByText('Lofi Player').closest('div[style]');
        const showBtn = [...lofiRow.querySelectorAll('button')].find(b => b.textContent === 'Show');
        fireEvent.click(showBtn);
        expect(mockState.setShowLofiPlayer).toHaveBeenCalledWith(true);
    });

    it('"Hide" calls setter with false for any widget', () => {
        const { getByText } = render(<WidgetToggles />);
        const weatherRow = getByText('Weather Widget').closest('div[style]');
        const hideBtn = [...weatherRow.querySelectorAll('button')].find(b => b.textContent === 'Hide');
        fireEvent.click(hideBtn);
        expect(mockState.setShowWeatherWidget).toHaveBeenCalledWith(false);
    });

    it('non-lofi "Show" buttons are never disabled regardless of stations', () => {
        mockState.lofiStations = [];
        const { getByText } = render(<WidgetToggles />);
        const weatherRow = getByText('Weather Widget').closest('div[style]');
        const showBtn = [...weatherRow.querySelectorAll('button')].find(b => b.textContent === 'Show');
        expect(showBtn.disabled).toBe(false);
    });
});
