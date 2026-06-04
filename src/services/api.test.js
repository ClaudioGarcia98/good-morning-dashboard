import { describe, it, expect, vi } from 'vitest';
import { fetchWithRetry } from './api';

describe('fetchWithRetry', () => {
  it('succeeds on first attempt if no error is thrown', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await fetchWithRetry(fn, 2, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries specified number of times and then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    const result = await fetchWithRetry(fn, 2, 10);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws error after all retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));
    await expect(fetchWithRetry(fn, 2, 10)).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
