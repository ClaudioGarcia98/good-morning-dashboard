import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAnimeSchedule } from './useAnimeSchedule';

vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ malUsername: 'test', setMalError: vi.fn(), setMalLoading: vi.fn(), setMalSuccess: vi.fn() })
}));

globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] })
});

describe('useAnimeSchedule', () => {
  it('returns default state', () => {
    const { result } = renderHook(() => useAnimeSchedule());
    expect(result.current.todayLoading).toBe(true);
  });
});
