import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getScheduleCache,
  setScheduleCache,
  parseMALItems,
  fetchDaySchedule,
  fetchUserWatchingList
} from './animeService';

describe('animeService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('cache operations', () => {
    it('returns empty object if cache is empty or invalid JSON', () => {
      expect(getScheduleCache()).toEqual({});
      localStorage.setItem('dash_anime_schedule_v2', 'invalid');
      expect(getScheduleCache()).toEqual({});
    });

    it('sets and gets cache correctly', () => {
      const mockData = { monday: { data: [1, 2], ts: Date.now() } };
      setScheduleCache(mockData);
      expect(getScheduleCache()).toEqual(mockData);
    });
  });

  describe('parseMALItems', () => {
    it('returns empty array if input is not an array', () => {
      expect(parseMALItems(null)).toEqual([]);
      expect(parseMALItems(undefined)).toEqual([]);
      expect(parseMALItems({})).toEqual([]);
    });

    it('parses valid MAL items correctly', () => {
      const raw = [{
        anime_id: 123,
        anime_url: '/anime/123/title',
        anime_image_path: 'img.jpg',
        anime_title: 'Title',
        anime_score_val: 8.5,
        num_watched_episodes: 5
      }];
      const expected = [{
        mal_id: 123,
        url: 'https://myanimelist.net/anime/123/title',
        image_url: 'img.jpg',
        title: 'Title',
        score: 8.5,
        watched_eps: 5
      }];
      expect(parseMALItems(raw)).toEqual(expected);
    });
  });

  describe('fetchDaySchedule', () => {
    it('returns cached data if still valid (under 1 hour)', async () => {
      const cache = {
        monday: { data: [{ mal_id: 1, title: 'Cached' }], ts: Date.now() - 1000 }
      };
      setScheduleCache(cache);
      const data = await fetchDaySchedule('monday');
      expect(data).toEqual(cache.monday.data);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('fetches fresh data if cache is expired or missing', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ mal_id: 2, title: 'Fresh' }] })
      });
      const data = await fetchDaySchedule('monday');
      expect(data).toEqual([{ mal_id: 2, title: 'Fresh' }]);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchUserWatchingList', () => {
    it('returns empty array if username is empty or falsy', async () => {
      const data1 = await fetchUserWatchingList('');
      const data2 = await fetchUserWatchingList(null);
      expect(data1).toEqual([]);
      expect(data2).toEqual([]);
    });

    it('successfully fetches and maps data from CORSProxy.io', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('corsproxy.io')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              anime_id: 97,
              anime_url: '/anime/97',
              anime_image_path: 'img3.jpg',
              anime_title: 'CORSProxy.io Title',
              anime_score_val: 9.0,
              num_watched_episodes: 5
            }]
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 97,
          url: 'https://myanimelist.net/anime/97',
          image_url: 'img3.jpg',
          title: 'CORSProxy.io Title',
          score: 9.0,
          watched_eps: 5
        }
      ]);
    });

    it('successfully fetches and maps data from AllOrigins', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.allorigins.win')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              contents: JSON.stringify([{
                anime_id: 99,
                anime_url: '/anime/99',
                anime_image_path: 'img.jpg',
                anime_title: 'AllOrigins Title',
                anime_score_val: 7.5,
                num_watched_episodes: 3
              }]),
              status: { http_code: 200 }
            })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 99,
          url: 'https://myanimelist.net/anime/99',
          image_url: 'img.jpg',
          title: 'AllOrigins Title',
          score: 7.5,
          watched_eps: 3
        }
      ]);
    });

    it('successfully fetches and maps data from CodeTabs', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.codetabs.com')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{
              anime_id: 98,
              anime_url: '/anime/98',
              anime_image_path: 'img2.jpg',
              anime_title: 'CodeTabs Title',
              anime_score_val: 8.0,
              num_watched_episodes: 4
            }]
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      const list = await fetchUserWatchingList('test');
      expect(list).toEqual([
        {
          mal_id: 98,
          url: 'https://myanimelist.net/anime/98',
          image_url: 'img2.jpg',
          title: 'CodeTabs Title',
          score: 8.0,
          watched_eps: 4
        }
      ]);
    });

    it('throws error if CORSProxy.io returns an error object instead of array', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('corsproxy.io')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ errors: [{ message: 'invalid request' }] })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      await expect(fetchUserWatchingList('test')).rejects.toThrow();
    });

    it('throws error if AllOrigins returns null contents', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.allorigins.win')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              contents: null,
              status: { http_code: 404 }
            })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      await expect(fetchUserWatchingList('test')).rejects.toThrow();
    });

    it('throws error if CodeTabs returns an error object instead of array', async () => {
      globalThis.fetch.mockImplementation((url) => {
        if (url.includes('api.codetabs.com')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ errors: [{ message: 'invalid request' }] })
          });
        }
        return Promise.reject(new Error('Proxy error'));
      });

      await expect(fetchUserWatchingList('test')).rejects.toThrow();
    });
  });
});
