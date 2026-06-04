import {
    JIKAN_BASE,
    ALLORIGINS_BASE,
    CODETABS_BASE,
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

export async function fetchUserWatchingList(malUsername) {
    if (!malUsername || malUsername.trim() === '') return [];

    const cacheBust = `&_=${Date.now()}`;
    const malUrl = `https://myanimelist.net/animelist/${malUsername}/load.json?offset=0&status=1${cacheBust}`;

    const makeAlloriginsRequest = async () => {
        const res = await fetch(ALLORIGINS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const wrapper = await res.json();
        return parseMALItems(JSON.parse(wrapper.contents));
    };

    const makeCodetabsRequest = async () => {
        const res = await fetch(CODETABS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        return parseMALItems(await res.json());
    };

    const makeJikanRequest = async () => {
        const res = await fetch(`${JIKAN_BASE}/users/${malUsername}/animelist?status=watching`, { cache: 'no-store' });
        if (!res.ok) throw new Error('no data');
        const jikanJson = await res.json();
        if (!jikanJson.data) throw new Error('no data');
        return jikanJson.data.map(item => {
            const anime = item.anime || {};
            return {
                mal_id: anime.mal_id || item.mal_id,
                url: anime.url || '',
                image_url: anime.images?.jpg?.small_image_url || '',
                title: anime.title || 'Unknown',
                score: anime.score || 'N/A',
                watched_eps: item.episodes_watched || 0,
            };
        });
    };

    return fetchWithRetry(async () => {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 1500)
        );
        return await Promise.race([
            Promise.any([makeAlloriginsRequest(), makeCodetabsRequest(), makeJikanRequest()]),
            timeoutPromise,
        ]);
    }, 0, 0).catch(e => {
        console.error('MAL fetch timed out or failed:', e);
        throw e;
    });
}
