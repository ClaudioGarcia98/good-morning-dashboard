import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MediaSettings from './MediaSettings';
import { useSettingsStore } from '../../stores/useSettingsStore';

vi.mock('../../stores/useSettingsStore');

const STATIONS = [
    { id: 1, videoId: 'lTRiuFIWV54', name: 'Lofi Girl' },
    { id: 2, videoId: '4xDzrJKXOOY', name: 'Synthwave Radio' },
];

let mockState;

beforeEach(() => {
    mockState = {
        volume: 0.5, setVolume: vi.fn(),
        gifName: '', setGifName: vi.fn(),
        setBackgroundUrl: vi.fn(), setBackgroundIsVideo: vi.fn(),
        lofiId: 'lTRiuFIWV54',
        setLofiId: vi.fn(),
        lofiStations: [...STATIONS],
        setLofiStations: vi.fn(),
    };

    useSettingsStore.mockImplementation((selector) =>
        typeof selector === 'function' ? selector(mockState) : mockState
    );
    useSettingsStore.getState = vi.fn(() => mockState);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ title: 'Fetched Title' }),
    }));
});

describe('MediaSettings — station list rendering', () => {
    it('renders all stations by name', () => {
        const { getByText } = render(<MediaSettings />);
        expect(getByText('Lofi Girl')).toBeTruthy();
        expect(getByText('Synthwave Radio')).toBeTruthy();
    });

    it('renders a YouTube link for each station', () => {
        const { container } = render(<MediaSettings />);
        const links = container.querySelectorAll('a[href*="youtube.com"]');
        expect(links.length).toBe(2);
        expect(links[0].href).toContain('lTRiuFIWV54');
        expect(links[1].href).toContain('4xDzrJKXOOY');
    });

    it('YouTube links open in a new tab', () => {
        const { container } = render(<MediaSettings />);
        const links = container.querySelectorAll('a[href*="youtube.com"]');
        links.forEach(link => expect(link.target).toBe('_blank'));
    });

    it('renders edit and delete buttons for each station', () => {
        const { container } = render(<MediaSettings />);
        expect(container.querySelectorAll('button[title="Edit"]').length).toBe(2);
        expect(container.querySelectorAll('button[title="Delete"]').length).toBe(2);
    });

    it('renders the add form with URL and name inputs', () => {
        const { container } = render(<MediaSettings />);
        const inputs = container.querySelectorAll('input[type="text"]');
        const placeholders = [...inputs].map(i => i.placeholder);
        expect(placeholders).toContain('YouTube ID or URL');
        expect(placeholders).toContain('Name (optional)');
    });
});

describe('MediaSettings — inline edit', () => {
    it('shows edit inputs when edit button is clicked', () => {
        const { container, getByPlaceholderText } = render(<MediaSettings />);
        const editBtns = container.querySelectorAll('button[title="Edit"]');
        fireEvent.click(editBtns[0]);
        expect(getByPlaceholderText('YouTube ID or URL')).toBeTruthy();
        expect(getByPlaceholderText('Name')).toBeTruthy();
    });

    it('save button calls setLofiStations with updated station', () => {
        const { container, getAllByPlaceholderText } = render(<MediaSettings />);
        fireEvent.click(container.querySelectorAll('button[title="Edit"]')[0]);

        const nameInputs = getAllByPlaceholderText('Name');
        fireEvent.change(nameInputs[0], { target: { value: 'New Name' } });

        const saveBtn = [...container.querySelectorAll('button')].find(b => b.textContent === 'Save');
        fireEvent.click(saveBtn);

        expect(mockState.setLofiStations).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id: 1, name: 'New Name' }),
            ])
        );
    });
});

describe('MediaSettings — delete station', () => {
    it('delete button calls setLofiStations with station removed', () => {
        const { container } = render(<MediaSettings />);
        const deleteBtns = container.querySelectorAll('button[title="Delete"]');
        fireEvent.click(deleteBtns[1]); // delete Synthwave Radio
        expect(mockState.setLofiStations).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ videoId: 'lTRiuFIWV54' })])
        );
        expect(mockState.setLofiStations).toHaveBeenCalledWith(
            expect.not.arrayContaining([expect.objectContaining({ videoId: '4xDzrJKXOOY' })])
        );
    });

    it('deleting active station calls setLofiId with fallback videoId', () => {
        const { container } = render(<MediaSettings />);
        const deleteBtns = container.querySelectorAll('button[title="Delete"]');
        fireEvent.click(deleteBtns[0]); // delete Lofi Girl (active)
        expect(mockState.setLofiId).toHaveBeenCalledWith('4xDzrJKXOOY');
    });

    it('deleting non-active station does not call setLofiId', () => {
        const { container } = render(<MediaSettings />);
        const deleteBtns = container.querySelectorAll('button[title="Delete"]');
        fireEvent.click(deleteBtns[1]); // delete Synthwave Radio (not active)
        expect(mockState.setLofiId).not.toHaveBeenCalled();
    });

    it('deleting last station falls back to default videoId', () => {
        mockState.lofiStations = [{ id: 1, videoId: 'lTRiuFIWV54', name: 'Lofi Girl' }];
        const { container } = render(<MediaSettings />);
        fireEvent.click(container.querySelector('button[title="Delete"]'));
        expect(mockState.setLofiId).toHaveBeenCalledWith('Gu-g8FRG4Zs');
    });
});

describe('MediaSettings — add station', () => {
    it('adds station with provided name without fetching', async () => {
        const { container, getByPlaceholderText } = render(<MediaSettings />);
        fireEvent.change(getByPlaceholderText('YouTube ID or URL'), { target: { value: 'newVideoId' } });
        fireEvent.change(getByPlaceholderText('Name (optional)'), { target: { value: 'My Station' } });
        fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Add'));

        await waitFor(() => {
            expect(mockState.setLofiStations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ videoId: 'newVideoId', name: 'My Station' }),
                ])
            );
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('fetches title from noembed when no name is provided', async () => {
        const { container, getByPlaceholderText } = render(<MediaSettings />);
        fireEvent.change(getByPlaceholderText('YouTube ID or URL'), { target: { value: 'newVideoId' } });
        fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Add'));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('noembed.com')
            );
        });
        await waitFor(() => {
            expect(mockState.setLofiStations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ videoId: 'newVideoId', name: 'Fetched Title' }),
                ])
            );
        });
    });

    it('extracts video ID from a full YouTube URL', async () => {
        const { container, getByPlaceholderText } = render(<MediaSettings />);
        fireEvent.change(getByPlaceholderText('YouTube ID or URL'), {
            target: { value: 'https://www.youtube.com/watch?v=newVideoId' },
        });
        fireEvent.change(getByPlaceholderText('Name (optional)'), { target: { value: 'URL Test' } });
        fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Add'));

        await waitFor(() => {
            expect(mockState.setLofiStations).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ videoId: 'newVideoId' }),
                ])
            );
        });
    });

    it('does not add a station when URL input is empty', async () => {
        const { container } = render(<MediaSettings />);
        fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Add'));
        await waitFor(() => {
            expect(mockState.setLofiStations).not.toHaveBeenCalled();
        });
    });

    it('clears inputs after adding a station', async () => {
        const { container, getByPlaceholderText } = render(<MediaSettings />);
        const urlInput = getByPlaceholderText('YouTube ID or URL');
        const nameInput = getByPlaceholderText('Name (optional)');
        fireEvent.change(urlInput, { target: { value: 'someId' } });
        fireEvent.change(nameInput, { target: { value: 'Some Name' } });
        fireEvent.click([...container.querySelectorAll('button')].find(b => b.textContent === 'Add'));

        await waitFor(() => {
            expect(urlInput.value).toBe('');
            expect(nameInput.value).toBe('');
        });
    });
});

describe('MediaSettings — volume slider', () => {
    it('renders the volume slider', () => {
        const { container } = render(<MediaSettings />);
        const slider = container.querySelector('input[type="range"]');
        expect(slider).toBeTruthy();
        expect(slider.value).toBe('0.5');
    });

    it('changing volume calls setVolume', () => {
        const { container } = render(<MediaSettings />);
        fireEvent.change(container.querySelector('input[type="range"]'), { target: { value: '0.8' } });
        expect(mockState.setVolume).toHaveBeenCalledWith(0.8);
    });
});
