import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimeSchedule } from './useAnimeSchedule';
import { fetchDaySchedule } from '../services/animeService';

vi.mock('zustand/react/shallow', () => ({
  useShallow: (f) => f,
}));

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const mockSettings = {
      malUsername: 'test',
      setMalError: vi.fn(),
      setMalLoading: vi.fn(),
      setMalSuccess: vi.fn(),
      volume: 0.5,
    };
    return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
  }),
}));

vi.mock('../services/animeService', () => ({
  fetchDaySchedule: vi.fn(),
  fetchUserWatchingList: vi.fn().mockResolvedValue([]),
}));

describe('useAnimeSchedule hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns default state initially', () => {
    fetchDaySchedule.mockResolvedValue([]);
    const { result } = renderHook(() => useAnimeSchedule());
    expect(result.current.todayLoading).toBe(true);
  });

  it('deduplicates todayData by mal_id', async () => {
    const mockData = [
      { mal_id: 1, title: 'Dr. Stone', score: 8.5 },
      { mal_id: 1, title: 'Dr. Stone', score: 8.5 },
      { mal_id: 2, title: 'Koori no Jouheki', score: 7.8 },
    ];
    fetchDaySchedule.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAnimeSchedule());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.displayList).toHaveLength(2);
    expect(result.current.displayList[0].title).toBe('Dr. Stone');
    expect(result.current.displayList[1].title).toBe('Koori no Jouheki');
  });
});
