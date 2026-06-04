export const JIKAN_BASE = 'https://api.jikan.moe/v4';
export const ALLORIGINS_BASE = 'https://api.allorigins.win/get?url=';
export const CODETABS_BASE = 'https://api.codetabs.com/v1/proxy?quest=';
export const SCHEDULE_CACHE_KEY = 'dash_anime_schedule_v2';
export const WATCHING_CACHE_KEY = 'dash_anime_watching';

export async function fetchWithRetry(fn, retries = 1, delay = 500) {
    try {
        return await fn();
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(fn, retries - 1, delay);
        }
        throw e;
    }
}
