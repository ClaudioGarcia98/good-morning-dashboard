import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../assets/animated_gif.mp4', () => ({ default: 'default-video.mp4' }));

const mockSetBackgroundUrl = vi.fn();
const mockSetBackgroundIsVideo = vi.fn();

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) =>
        selector({
            setBackgroundUrl: mockSetBackgroundUrl,
            setBackgroundIsVideo: mockSetBackgroundIsVideo,
        })
    ),
}));

function makeIdbMock({ blob = null, openError = false, getError = false } = {}) {
    const getRequest = { onsuccess: null, onerror: null };

    const objectStore = {
        get: vi.fn(() => {
            Promise.resolve().then(() => {
                if (getError) {
                    getRequest.onerror?.({ target: { error: new Error('get failed') } });
                } else {
                    getRequest.onsuccess?.({ target: { result: blob } });
                }
            });
            return getRequest;
        }),
    };

    const transaction = { objectStore: vi.fn(() => objectStore) };
    const db = { transaction: vi.fn(() => transaction), createObjectStore: vi.fn() };
    const openRequest = { onupgradeneeded: null, onsuccess: null, onerror: null };

    const open = vi.fn(() => {
        Promise.resolve().then(() => {
            if (openError) {
                openRequest.onerror?.({ target: { error: new Error('open failed') } });
            } else {
                openRequest.onsuccess?.({ target: { result: db } });
            }
        });
        return openRequest;
    });

    return { open, db, objectStore };
}

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.indexedDB;
});

const { useBackgroundLoader } = await import('../useBackgroundLoader.js');

describe('useBackgroundLoader — video blob in IndexedDB', () => {
    it('creates a blob URL and sets it as backgroundUrl', async () => {
        const blob = new Blob(['data'], { type: 'video/mp4' });
        const { open } = makeIdbMock({ blob });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(mockSetBackgroundUrl).toHaveBeenCalledWith('blob:mock-url');
    });

    it('sets backgroundIsVideo to true for a video blob', async () => {
        const blob = new Blob(['data'], { type: 'video/webm' });
        const { open } = makeIdbMock({ blob });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(mockSetBackgroundIsVideo).toHaveBeenCalledWith(true);
    });
});

describe('useBackgroundLoader — image blob in IndexedDB', () => {
    it('creates a blob URL and sets it as backgroundUrl', async () => {
        const blob = new Blob(['data'], { type: 'image/gif' });
        const { open } = makeIdbMock({ blob });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
        expect(mockSetBackgroundUrl).toHaveBeenCalledWith('blob:mock-url');
    });

    it('sets backgroundIsVideo to false for an image blob', async () => {
        const blob = new Blob(['data'], { type: 'image/gif' });
        const { open } = makeIdbMock({ blob });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(mockSetBackgroundIsVideo).toHaveBeenCalledWith(false);
    });
});

describe('useBackgroundLoader — no blob in IndexedDB', () => {
    it('falls back to defaultVideo when get returns null', async () => {
        const { open } = makeIdbMock({ blob: null });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(mockSetBackgroundUrl).toHaveBeenCalledWith('default-video.mp4');
    });

    it('sets backgroundIsVideo to true for the default .mp4 fallback', async () => {
        const { open } = makeIdbMock({ blob: null });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(mockSetBackgroundIsVideo).toHaveBeenCalledWith(true);
    });
});

describe('useBackgroundLoader — IndexedDB open failure', () => {
    it('falls back to defaultVideo when open errors', async () => {
        const { open } = makeIdbMock({ openError: true });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(mockSetBackgroundUrl).toHaveBeenCalledWith('default-video.mp4');
        expect(mockSetBackgroundIsVideo).toHaveBeenCalledWith(true);
    });
});

describe('useBackgroundLoader — IndexedDB get failure', () => {
    it('falls back to defaultVideo when the get transaction errors', async () => {
        const { open } = makeIdbMock({ getError: true });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(URL.createObjectURL).not.toHaveBeenCalled();
        expect(mockSetBackgroundUrl).toHaveBeenCalledWith('default-video.mp4');
        expect(mockSetBackgroundIsVideo).toHaveBeenCalledWith(true);
    });
});

describe('useBackgroundLoader — cleanup', () => {
    it('revokes the blob URL on unmount when a blob was loaded', async () => {
        const blob = new Blob(['data'], { type: 'video/mp4' });
        const { open } = makeIdbMock({ blob });
        globalThis.indexedDB = { open };

        let unmount;
        await act(async () => {
            ({ unmount } = renderHook(() => useBackgroundLoader()));
            await flushPromises();
        });

        unmount();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('does not call revokeObjectURL on unmount when no blob was loaded', async () => {
        const { open } = makeIdbMock({ blob: null });
        globalThis.indexedDB = { open };

        let unmount;
        await act(async () => {
            ({ unmount } = renderHook(() => useBackgroundLoader()));
            await flushPromises();
        });

        unmount();
        expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('does not call revokeObjectURL on unmount after an open error', async () => {
        const { open } = makeIdbMock({ openError: true });
        globalThis.indexedDB = { open };

        let unmount;
        await act(async () => {
            ({ unmount } = renderHook(() => useBackgroundLoader()));
            await flushPromises();
        });

        unmount();
        expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
});

describe('useBackgroundLoader — IndexedDB interactions', () => {
    it('opens dashDB at version 1', async () => {
        const { open } = makeIdbMock({ blob: null });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(open).toHaveBeenCalledWith('dashDB', 1);
    });

    it('queries the bg key from object store s', async () => {
        const { open, objectStore } = makeIdbMock({ blob: null });
        globalThis.indexedDB = { open };

        await act(async () => {
            renderHook(() => useBackgroundLoader());
            await flushPromises();
        });

        expect(objectStore.get).toHaveBeenCalledWith('bg');
    });
});
