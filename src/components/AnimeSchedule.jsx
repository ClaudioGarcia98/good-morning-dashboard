import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const DAYS = ['sundays', 'mondays', 'tuesdays', 'wednesdays', 'thursdays', 'fridays', 'saturdays'];
const DAY_FILTERS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const todayIdx = new Date().getDay();
const todayStr = DAYS[todayIdx];
const todayFilter = DAY_FILTERS[todayIdx];

export default function AnimeSchedule() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeDay, setActiveDay] = useState(todayFilter);
    const [sidebarData, setSidebarData] = useState([]);
    const [sidebarLoading, setSidebarLoading] = useState(false);
    
    const [todayData, setTodayData] = useState([]);
    const [userWatching, setUserWatching] = useState([]);
    const [todayLoading, setTodayLoading] = useState(true);

    const sidebarRef = useRef(null);
    const toggleRef = useRef(null);

    const getScheduleCache = () => {
        try { return JSON.parse(localStorage.getItem('dash_anime_schedule_v2') || '{}'); } 
        catch (e) { return {}; }
    };

    const setScheduleCache = (cache) => {
        localStorage.setItem('dash_anime_schedule_v2', JSON.stringify(cache));
    };

    const fetchDaySchedule = async (dayFilter) => {
        const cache = getScheduleCache();
        const entry = cache[dayFilter];
        if (entry && Date.now() - entry.ts < 3600000) {
            return entry.data;
        }
        try {
            const res = await fetch('https://api.jikan.moe/v4/schedules?filter=' + dayFilter);
            if (!res.ok) throw new Error(res.status);
            const json = await res.json();
            const data = json.data || [];
            cache[dayFilter] = { data, ts: Date.now() };
            setScheduleCache(cache);
            return data;
        } catch (e) {
            console.error('Schedule fetch error for ' + dayFilter + ':', e);
            return (entry && entry.data) || [];
        }
    };

    const parseMALItems = (raw) => {
        return raw.map(a => ({
            mal_id: a.anime_id,
            url: 'https://myanimelist.net' + a.anime_url,
            image_url: a.anime_image_path,
            title: a.anime_title,
            score: a.anime_score_val || 'N/A',
            watched_eps: a.num_watched_episodes
        }));
    };

    const fetchUserWatching = async () => {
        const cacheBust = '&_t=' + Date.now();
        const malUrl = 'https://myanimelist.net/animelist/claclo98/load.json?offset=0&status=1' + cacheBust;
        
        const makeAlloriginsRequest = async () => {
            const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(malUrl), { cache: 'no-store' });
            if (!res.ok) throw new Error(res.status);
            const wrapper = await res.json();
            return parseMALItems(JSON.parse(wrapper.contents));
        };
        const makeCodetabsRequest = async () => {
            const res = await fetch('https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(malUrl), { cache: 'no-store' });
            if (!res.ok) throw new Error(res.status);
            return parseMALItems(await res.json());
        };
        const makeJikanRequest = async () => {
            const res = await fetch('https://api.jikan.moe/v4/users/claclo98/animelist?status=watching', { cache: 'no-store' });
            if (!res.ok) throw new Error(res.status);
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
                    watched_eps: item.episodes_watched || 0
                };
            });
        };

        try {
            return await Promise.any([makeAlloriginsRequest(), makeCodetabsRequest(), makeJikanRequest()]);
        } catch (e) {
            console.error('All MAL fetches failed:', e);
            return [];
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            let cachedWatching = [];
            try {
                const cached = JSON.parse(localStorage.getItem('dash_anime_watching') || '[]');
                if (cached.length > 0 && typeof cached[0] === 'object') cachedWatching = cached;
            } catch(e) {}
            
            if (isMounted) setUserWatching(cachedWatching);

            const tData = await fetchDaySchedule(todayFilter);
            if (isMounted) {
                setTodayData(tData);
                setTodayLoading(false);
            }

            const freshWatching = await fetchUserWatching();
            if (freshWatching && freshWatching.length > 0 && isMounted) {
                localStorage.setItem('dash_anime_watching', JSON.stringify(freshWatching));
                setUserWatching(freshWatching);
            }
        };

        setTimeout(loadInitialData, 1000);

        const handleClickOutside = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target) &&
                toggleRef.current && !toggleRef.current.contains(e.target)) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            isMounted = false;
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const loadSidebarData = async () => {
            setSidebarLoading(true);
            const data = await fetchDaySchedule(activeDay);
            const sorted = [...data].sort((a,b) => {
                if(a.broadcast.time && b.broadcast.time) return a.broadcast.time.localeCompare(b.broadcast.time);
                return 0;
            });
            setSidebarData(sorted);
            setSidebarLoading(false);
        };
        if (isSidebarOpen) {
            loadSidebarData();
        }
    }, [activeDay, isSidebarOpen]);

    const getDisplayList = () => {
        if (!todayData || todayData.length === 0) return [];
        const userWatchingIds = userWatching.map(u => u.mal_id);
        const watchedToday = todayData
            .filter(a => userWatchingIds.includes(a.mal_id))
            .sort((a,b) => (b.score || 0) - (a.score || 0));
            
        if (watchedToday.length >= 5) {
            return watchedToday;
        } else {
            const othersToday = todayData
                .filter(a => !userWatchingIds.includes(a.mal_id))
                .sort((a,b) => (b.score || 0) - (a.score || 0));
            return [...watchedToday, ...othersToday.slice(0, 5 - watchedToday.length)];
        }
    };

    const displayList = getDisplayList();
    const userWatchingIds = userWatching.map(u => u.mal_id);

    const [portalNode, setPortalNode] = useState(null);

    useEffect(() => {
        setPortalNode(document.getElementById('mainUi'));
    }, []);

    const [previewTrailer, setPreviewTrailer] = useState(null);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const hoverTimer = useRef(null);
    const hideTimer = useRef(null);

    const handleMouseEnter = (e, anime) => {
        clearTimeout(hideTimer.current);
        let yid = anime.trailer?.youtube_id;
        if (!yid && anime.trailer?.embed_url) {
            const match = anime.trailer.embed_url.match(/embed\/([^?]+)/);
            if (match) yid = match[1];
        }
        if (!yid) {
            setPreviewTrailer(null);
            return;
        }
        
        const rect = e.currentTarget.getBoundingClientRect();
        const isSidebar = e.currentTarget.classList.contains('anime-card');
        const x = isSidebar ? rect.left - 320 : rect.right + 20;
        const y = rect.top;
        
        hoverTimer.current = setTimeout(() => {
            setPreviewTrailer(yid);
            setPreviewPos({ x, y });
        }, 500);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimer.current);
        hideTimer.current = setTimeout(() => {
            setPreviewTrailer(null);
        }, 300);
    };

    const handleTrailerMouseEnter = () => {
        clearTimeout(hideTimer.current);
    };

    const handleTrailerMouseLeave = () => {
        hideTimer.current = setTimeout(() => {
            setPreviewTrailer(null);
        }, 300);
    };

    const sidebarContent = (
        <>
            <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                <div 
                    className="anime-toggle" 
                    id="animeToggle" 
                    title="Anime Schedule"
                    ref={toggleRef}
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <svg viewBox="0 0 24 24"><path d="M21.2 5.5l-1.4-1.4c-.4-.4-1-.4-1.4 0l-1.4 1.4-1.4-1.4c-.4-.4-1-.4-1.4 0L14.2 5.5l-1.4-1.4c-.4-.4-1-.4-1.4 0l-1.4 1.4-1.4-1.4c-.4-.4-1-.4-1.4 0L7.2 5.5 5.8 4.1c-.4-.4-1-.4-1.4 0L2.8 5.7c-.5.5-.8 1.1-.8 1.8v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-10c0-.7-.3-1.3-.8-1.8zM20 17.5H4v-8h16v8z"/></svg>
                </div>
            </div>

            <div className={`anime-sidebar ${isSidebarOpen ? 'open' : ''}`} id="animeSidebar" ref={sidebarRef}>
                <div className="as-header">
                    <span>Anime Schedule</span>
                    <button className="as-close" onClick={() => setIsSidebarOpen(false)}>&times;</button>
                </div>
                <div className="as-days">
                    {DAY_FILTERS.map((df, i) => (
                        <button 
                            key={df}
                            className={`as-day-btn ${activeDay === df ? 'active' : ''}`}
                            onClick={() => setActiveDay(df)}
                        >
                            {DAYS[i].charAt(0).toUpperCase() + DAYS[i].slice(1)}
                        </button>
                    ))}
                </div>
                <div className="as-content">
                    {sidebarLoading ? (
                        <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>Loading...</div>
                    ) : sidebarData.length === 0 ? (
                        <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>No anime scheduled.</div>
                    ) : (
                        sidebarData.map(anime => (
                            <a 
                                key={anime.mal_id} 
                                href={anime.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="anime-card"
                                onMouseEnter={(e) => handleMouseEnter(e, anime)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <img src={anime.images?.jpg?.small_image_url} alt="poster" />
                                <div className="anime-info">
                                    <div className="anime-title">{anime.title}</div>
                                    <div className="anime-time">
                                        🕒 {anime.broadcast?.time || '?'} {anime.score && `• ⭐ ${anime.score}`}
                                    </div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>
        </>
    );

    return (
        <>
            <div className="today-anime-box" id="todayAnimeBox">
                <div className="tab-header">
                    <span className="tab-title">Today's Launch</span>
                </div>
                <div className="tab-list" id="tabList">
                    {todayLoading ? (
                        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Loading schedule...</div>
                    ) : displayList.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>No anime airing today.</div>
                    ) : (
                        displayList.map(anime => (
                            <a 
                                key={anime.mal_id}
                                href={anime.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`tab-item ${userWatchingIds.includes(anime.mal_id) ? 'watched-highlight' : ''}`}
                                onMouseEnter={(e) => handleMouseEnter(e, anime)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <img src={anime.images?.jpg?.small_image_url} alt="poster" />
                                <div className="tab-item-info">
                                    <div className="tab-item-title">{anime.title}</div>
                                    <div className="tab-item-meta">⭐ {anime.score || 'N/A'} • 🕒 {anime.broadcast?.time || '?'}</div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>
            {portalNode && createPortal(sidebarContent, portalNode)}
            {portalNode && previewTrailer && createPortal(
                <div style={{
                    position: 'fixed',
                    left: Math.max(20, previewPos.x),
                    top: Math.max(20, Math.min(previewPos.y, window.innerHeight - 190)),
                    width: '300px',
                    height: '169px',
                    background: '#000',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    zIndex: 99999,
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                    animation: 'fadeSlideIn 0.3s ease both'
                }}
                onMouseEnter={handleTrailerMouseEnter}
                onMouseLeave={handleTrailerMouseLeave}
                >
                    <iframe 
                        width="300" height="169" 
                        src={`https://www.youtube.com/embed/${previewTrailer}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`} 
                        title="Trailer Preview" 
                        frameBorder="0" 
                        allow="autoplay; encrypted-media" 
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                </div>
            , portalNode)}
        </>
    );
}
