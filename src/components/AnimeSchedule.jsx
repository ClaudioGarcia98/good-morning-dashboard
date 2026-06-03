import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../context/useSettings';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_FILTERS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];



// Helper to calculate countdown (+1.5 hours for internet release)
const calculateTimeLeft = (broadcast) => {
    if (!broadcast || !broadcast.time || !broadcast.day) return null;
    
    const dayMap = { 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0 };
    const cleanDay = broadcast.day.toLowerCase().replace(/s$/, '');
    const targetDay = dayMap[cleanDay];
    if (targetDay === undefined) return null;

    const [hours, minutes] = broadcast.time.split(':').map(Number);
    
    // JST is UTC+9. Shift real UTC time forward by 9 hours.
    const nowReal = Date.now();
    const jstNow = new Date(nowReal + (9 * 60 * 60 * 1000));
    
    let target = new Date(jstNow.getTime());
    target.setUTCHours(hours, minutes, 0, 0);
    
    // If the target day is different or we already passed the time today, move forward
    while (target.getUTCDay() !== targetDay || target.getTime() < jstNow.getTime()) {
        target.setUTCDate(target.getUTCDate() + 1);
    }

    // Add 1.5 hours for internet sub release
    target.setUTCMinutes(target.getUTCMinutes() + 90);

    const diff = target.getTime() - jstNow.getTime();
    if (diff <= 0) return "Out Now!";
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    
    const pad = (n) => n.toString().padStart(2, '0');
    if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
    return `${pad(h)}h ${pad(m)}m`;
};

const CountdownBadge = ({ broadcast }) => {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(broadcast));
    
    useEffect(() => {
        if (!broadcast) return;
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft(broadcast)), 60000);
        return () => clearInterval(timer);
    }, [broadcast]);

    if (!timeLeft) return null;
    return (
        <div className="anime-countdown">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
            <span>{timeLeft}</span>
        </div>
    );
};

export default React.memo(function AnimeSchedule() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedAnime, setExpandedAnime] = useState(null);
    const { volume } = useSettings();

    useEffect(() => {
        const closeSidebar = () => setIsSidebarOpen(false);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeSidebar();
        };
        window.addEventListener('app-idle', closeSidebar);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('app-idle', closeSidebar);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const handleCollapseClick = (e) => {
            if (expandedAnime && !e.target.closest('.anime-card') && !e.target.closest('.tab-item') && !e.target.closest('.trailer-portal-container')) {
                setExpandedAnime(null);
            }
        };
        document.addEventListener('mousedown', handleCollapseClick);
        return () => document.removeEventListener('mousedown', handleCollapseClick);
    }, [expandedAnime]);
    const todayFilter = DAY_FILTERS[(new Date().getDay() + 6) % 7];
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

    const fetchDaySchedule = useCallback(async (dayFilter) => {
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
    }, []);

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

    const fetchUserWatching = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            let cachedWatching = [];
            try {
                const cached = JSON.parse(localStorage.getItem('dash_anime_watching') || '[]');
                if (cached.length > 0 && typeof cached[0] === 'object') cachedWatching = cached;
            } catch(e) {
                console.error('Failed to parse anime watching cache, resetting:', e);
                localStorage.removeItem('dash_anime_watching');
            }
            
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

        const timerId = setTimeout(loadInitialData, 1000);

        const handleClickOutside = (e) => {
            if (!document.contains(e.target)) return; // Ignore clicks on elements that were unmounted
            if (sidebarRef.current && !sidebarRef.current.contains(e.target) &&
                toggleRef.current && !toggleRef.current.contains(e.target) &&
                !e.target.closest('.trailer-portal-container')) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            isMounted = false;
            clearTimeout(timerId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const loadSidebarData = async () => {
            setSidebarLoading(true);
            const data = await fetchDaySchedule(activeDay);
            
            // Deduplicate by mal_id and filter out entries without a broadcast time
            const uniqueData = Array.from(new Map(data.map(item => [item.mal_id, item])).values())
                .filter(a => a.broadcast && a.broadcast.time);
                
            const sorted = uniqueData.sort((a,b) => {
                return a.broadcast.time.localeCompare(b.broadcast.time);
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

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);
    const sidebarPortal = isMounted ? document.getElementById('mainUi') : null;
    const trailerPortal = isMounted ? document.body : null;


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
        if (!yid && anime.trailer?.url) {
            const match = anime.trailer.url.match(/(?:v=|youtu\.be\/)([^&?#]+)/);
            if (match) yid = match[1];
        }
        if (!yid) {
            setPreviewTrailer(null);
            return;
        }
        
        const rect = e.currentTarget.getBoundingClientRect();
        const isSidebar = e.currentTarget.closest('.anime-sidebar') !== null;
        const previewWidth = 300;
        const previewHeight = 169;
        
        let x, y;
        if (isSidebar) {
            x = rect.left - previewWidth - 20;
            if (x < 10) x = rect.right + 10;
        } else {
            x = rect.right + 20;
            if (x + previewWidth > window.innerWidth - 10) {
                x = rect.left - previewWidth - 20;
            }
        }
        y = rect.top + (rect.height / 2) - (previewHeight / 2);
        y = Math.max(10, Math.min(y, window.innerHeight - previewHeight - 10));
        x = Math.max(10, x);
        
        hoverTimer.current = setTimeout(() => {
            setPreviewTrailer(yid);
            setPreviewPos({ x, y });
        }, 400);
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

    const [trailerMuted, setTrailerMuted] = useState(() => {
        const saved = localStorage.getItem('dash_trailer_muted');
        return saved === null ? true : saved === 'true';
    });
    const trailerIframeRef = useRef(null);

    const handleUnmute = () => {
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'unMute',
                args: []
            }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [Math.round(volume * 100)]
            }), '*');
        }
        setTrailerMuted(false);
        localStorage.setItem('dash_trailer_muted', 'false');
    };

    const handleMute = () => {
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'mute',
                args: []
            }), '*');
        }
        setTrailerMuted(true);
        localStorage.setItem('dash_trailer_muted', 'true');
    };

    // Auto-unmute new trailers if user preference is unmuted
    useEffect(() => {
        if (!previewTrailer || trailerMuted) return;
        // Wait for iframe to load, then send unmute command
        const timer = setTimeout(() => {
            const iframe = trailerIframeRef.current;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'unMute',
                    args: []
                }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'setVolume',
                    args: [Math.round(volume * 100)]
                }), '*');
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [previewTrailer, trailerMuted, volume]);

    // Live volume sync
    useEffect(() => {
        if (!previewTrailer || trailerMuted) return;
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [Math.round(volume * 100)]
            }), '*');
        }
    }, [volume, previewTrailer, trailerMuted]);

    const sidebarContent = (
        <>
            <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                <button 
                    className={`anime-toggle ${isSidebarOpen ? 'open' : ''}`}
                    id="animeToggle" 
                    title="Anime Schedule"
                    ref={toggleRef}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <svg viewBox="0 0 24 24"><path d="M21.2 5.5l-1.4-1.4c-.4-.4-1-.4-1.4 0l-1.4 1.4-1.4-1.4c-.4-.4-1-.4-1.4 0L14.2 5.5l-1.4-1.4c-.4-.4-1-.4-1.4 0l-1.4 1.4-1.4-1.4c-.4-.4-1-.4-1.4 0L7.2 5.5 5.8 4.1c-.4-.4-1-.4-1.4 0L2.8 5.7c-.5.5-.8 1.1-.8 1.8v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-10c0-.7-.3-1.3-.8-1.8zM20 17.5H4v-8h16v8z"/></svg>
                </button>
            </div>

            <aside className={`anime-sidebar ${isSidebarOpen ? 'open' : ''}`} id="animeSidebar" ref={sidebarRef}>
                <header className="as-header">
                    <div className="as-header-titles">
                        <h2>Anime Schedule</h2>
                        <span className="as-subtitle">Daily Airing Episodes</span>
                    </div>
                    <button className="as-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close Sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>
                <div className="as-days">
                    {DAY_FILTERS.map((df, i) => {
                        const dayName = DAYS[i].charAt(0).toUpperCase() + DAYS[i].substring(1, 3);
                        return (
                            <div 
                                key={df} 
                                className={`as-tab ${activeDay === df ? 'active' : ''}`}
                                onClick={() => setActiveDay(df)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActiveDay(df);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                {dayName}
                            </div>
                        );
                    })}
                </div>
                <div className="as-content">
                    {sidebarLoading ? (
                        <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>Loading...</div>
                    ) : sidebarData.length === 0 ? (
                        <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>No anime scheduled.</div>
                    ) : (
                        sidebarData.map((anime, index) => {
                            const isExpanded = expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'sidebar';
                            const isLastItem = index === sidebarData.length - 1;
                            return (
                                <div 
                                    key={anime.mal_id} 
                                    id={`sidebar-anime-${anime.mal_id}`}
                                    className={`anime-card ${userWatchingIds.includes(anime.mal_id) ? 'watched-highlight' : ''} ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => {
                                        const expand = !isExpanded;
                                        setExpandedAnime(expand ? { id: anime.mal_id, source: 'sidebar' } : null);
                                        if (expand) {
                                            setTimeout(() => {
                                                const el = document.getElementById(`sidebar-anime-${anime.mal_id}`);
                                                if (el) {
                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }
                                            }, 310);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            const expand = !isExpanded;
                                            setExpandedAnime(expand ? { id: anime.mal_id, source: 'sidebar' } : null);
                                            if (expand) {
                                                setTimeout(() => {
                                                    const el = document.getElementById(`sidebar-anime-${anime.mal_id}`);
                                                    if (el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }
                                                }, 310);
                                            }
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onMouseEnter={(e) => handleMouseEnter(e, anime)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="anime-card-main">
                                        <div className="anime-img-container">
                                            <img src={anime.images?.jpg?.image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.small_image_url} alt="poster" />
                                        </div>
                                        <div className="anime-info">
                                            <div className="anime-title">{anime.title}</div>
                                            <div className="anime-time">
                                                <span>🕒 {anime.broadcast?.time || '?'} {anime.score && `• ⭐ ${anime.score}`}</span>
                                            </div>
                                            <CountdownBadge broadcast={anime.broadcast} />
                                        </div>
                                    </div>
                                    <div className="synopsis-wrapper">
                                        <div className="anime-synopsis-panel">
                                            <div className="synopsis-inner">
                                                <div className="anime-genres">
                                                    {(anime.genres || []).slice(0, 3).map(g => (
                                                        <span key={g.mal_id} className="anime-tag">{g.name}</span>
                                                    ))}
                                                </div>
                                                <p className="anime-synopsis-text">
                                                    {anime.synopsis || 'No synopsis available.'}
                                                </p>
                                                <a href={anime.url} target="_blank" rel="noopener noreferrer" className="anime-mal-link">
                                                    View on MyAnimeList ↗
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>
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
                        displayList.map(anime => {
                            const isExpanded = expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'today';
                            return (
                                <div 
                                    key={anime.mal_id}
                                    id={`tab-anime-${anime.mal_id}`}
                                    className={`tab-item ${userWatchingIds.includes(anime.mal_id) ? 'watched-highlight' : ''} ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => {
                                        const expand = !isExpanded;
                                        setExpandedAnime(expand ? { id: anime.mal_id, source: 'today' } : null);
                                        if (expand) {
                                            setTimeout(() => {
                                                const el = document.getElementById(`tab-anime-${anime.mal_id}`);
                                                if (el) {
                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }
                                            }, 310);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            const expand = !isExpanded;
                                            setExpandedAnime(expand ? { id: anime.mal_id, source: 'today' } : null);
                                            if (expand) {
                                                setTimeout(() => {
                                                    const el = document.getElementById(`tab-anime-${anime.mal_id}`);
                                                    if (el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }
                                                }, 310);
                                            }
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onMouseEnter={(e) => handleMouseEnter(e, anime)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="tab-item-main">
                                        <div className="tab-img-container">
                                            <img src={anime.images?.jpg?.small_image_url} alt="poster" />
                                        </div>
                                        <div className="tab-item-info" style={{ flex: 1, minWidth: 0 }}>
                                            <div className="tab-item-title">{anime.title}</div>
                                            <div className="tab-item-meta">
                                                <span>⭐ {anime.score || 'N/A'} • 🕒 {anime.broadcast?.time || '?'}</span>
                                            </div>
                                        </div>
                                        <div className="tab-item-timer" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                            <div>
                                                <CountdownBadge broadcast={anime.broadcast} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-synopsis-wrapper">
                                        <div className="tab-synopsis-panel">
                                            <div className="tab-synopsis-inner">
                                                <p className="anime-synopsis-text">
                                                    {anime.synopsis || 'No synopsis available.'}
                                                </p>
                                                <a href={anime.url} target="_blank" rel="noopener noreferrer" className="anime-mal-link">
                                                    View on MyAnimeList ↗
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            {sidebarPortal && createPortal(sidebarContent, sidebarPortal)}
            {trailerPortal && previewTrailer && createPortal(
                <div 
                    className="trailer-portal-container"
                    style={{
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
                    <div style={{ borderRadius: '12px', overflow: 'hidden', width: '300px', height: '169px', position: 'relative' }}>
                        <iframe
                            ref={trailerIframeRef}
                            src={`https://www.youtube.com/embed/${previewTrailer}?autoplay=1&mute=1&enablejsapi=1&modestbranding=1&showinfo=0&rel=0&controls=0&playsinline=1&origin=${window.location.origin}`}
                            width="300"
                            height="169"
                            style={{ border: 'none', display: 'block' }}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                        {/* Unmute/Mute toggle button */}
                        <button
                            onClick={trailerMuted ? handleUnmute : handleMute}
                            style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.7)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s ease',
                                zIndex: 2
                            }}
                            title={trailerMuted ? 'Unmute' : 'Mute'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                                {trailerMuted ? (
                                    <>
                                        <line x1="23" y1="9" x2="17" y2="15" />
                                        <line x1="17" y1="9" x2="23" y2="15" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            , trailerPortal)}
        </>
    );
});
