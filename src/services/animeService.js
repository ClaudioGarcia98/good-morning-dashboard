import {
    JIKAN_BASE,
    ALLORIGINS_BASE,
    CODETABS_BASE,
    CORSPROXY_IO_BASE,
    SCHEDULE_CACHE_KEY,
    fetchWithRetry,
} from './api.js';

export function getScheduleCache() {
    try { return JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || '{}'); }
    catch { return {}; }
}

export function setScheduleCache(cache) {
    localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(cache));
}

export function parseMALItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(a => ({
        mal_id: a.anime_id,
        url: 'https://myanimelist.net' + a.anime_url,
        image_url: a.anime_image_path,
        title: a.anime_title,
        score: a.anime_score_val || 'N/A',
        watched_eps: a.num_watched_episodes,
    }));
}

export async function fetchDaySchedule(dayFilter) {
    const cache = getScheduleCache();
    const entry = cache[dayFilter];
    if (entry && Date.now() - entry.ts < 3600000) {
        return entry.data;
    }

    return fetchWithRetry(async () => {
        const res = await fetch(`${JIKAN_BASE}/schedules?filter=${dayFilter}`);
        if (!res.ok) throw new Error(res.status);
        const json = await res.json();
        const data = json.data || [];
        cache[dayFilter] = { data, ts: Date.now() };
        setScheduleCache(cache);
        return data;
    }, 1, 1000).catch(e => {
        console.error('Schedule fetch error for ' + dayFilter + ':', e);
        if (entry && entry.data) return entry.data;
        throw e;
    });
}

function fetchWithTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
}

export async function fetchUserWatchingList(malUsername) {
    if (!malUsername || malUsername.trim() === '') return [];

    const cacheBust = `&_=${Date.now()}`;
    const malUrl = `https://myanimelist.net/animelist/${malUsername}/load.json?offset=0&status=1${cacheBust}`;

    const makeCorsproxyioRequest = async () => {
        const res = await fetch(CORSPROXY_IO_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    const makeAlloriginsRequest = async () => {
        const res = await fetch(ALLORIGINS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const wrapper = await res.json();
        
        if (!wrapper || wrapper.contents === null || wrapper.contents === undefined) {
            throw new Error('User not found or proxy error');
        }
        if (wrapper.status && wrapper.status.http_code && wrapper.status.http_code !== 200) {
            throw new Error(`Target returned status ${wrapper.status.http_code}`);
        }

        const parsed = JSON.parse(wrapper.contents);
        if (!Array.isArray(parsed)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(parsed);
    };

    const makeCodetabsRequest = async () => {
        const res = await fetch(CODETABS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    return fetchWithRetry(async () => {
        try {
            return await fetchWithTimeout(makeCorsproxyioRequest(), 2500);
        } catch {
            console.warn('Primary MAL proxy failed or timed out, trying fallbacks...');
            return await fetchWithTimeout(
                Promise.any([makeAlloriginsRequest(), makeCodetabsRequest()]),
                4500
            );
        }
    }, 0, 0).catch(e => {
        console.error('MAL fetch timed out or failed:', e);
        throw e;
    });
}
