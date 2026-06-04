import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchDaySchedule, fetchUserWatchingList } from '../services/animeService';
import { WATCHING_CACHE_KEY } from '../services/api';

const DAY_FILTERS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const todayFilter = DAY_FILTERS[(new Date().getDay() + 6) % 7];

export function useAnimeSchedule() {
    const { volume, malUsername, setMalError, setMalLoading, setMalSuccess } = useSettingsStore(useShallow(s => ({ volume: s.volume, malUsername: s.malUsername, setMalError: s.setMalError, setMalLoading: s.setMalLoading, setMalSuccess: s.setMalSuccess })));

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedAnime, setExpandedAnime] = useState(null);
    const [activeDay, setActiveDay] = useState(todayFilter);

    const [todayData, setTodayData] = useState([]);
    const [todayLoading, setTodayLoading] = useState(true);
    const [todayError, setTodayError] = useState(false);

    const [sidebarData, setSidebarData] = useState([]);
    const [sidebarLoading, setSidebarLoading] = useState(false);
    const [sidebarError, setSidebarError] = useState(false);

    const [userWatching, setUserWatching] = useState([]);

    const [previewTrailer, setPreviewTrailer] = useState(null);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const [trailerMuted, setTrailerMuted] = useState(() => {
        const saved = localStorage.getItem('dash_trailer_muted');
        return saved === null ? true : saved === 'true';
    });

    const sidebarRef = useRef(null);
    const toggleRef = useRef(null);
    const hoverTimer = useRef(null);
    const hideTimer = useRef(null);
    const trailerIframeRef = useRef(null);
    const prevMalUsername = useRef(malUsername);

    // Idle / Escape → close sidebar
    useEffect(() => {
        const closeSidebar = () => setIsSidebarOpen(false);
        const handleKeyDown = (e) => { if (e.key === 'Escape') closeSidebar(); };
        window.addEventListener('app-idle', closeSidebar);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('app-idle', closeSidebar);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Click-outside collapse for expanded card
    useEffect(() => {
        const handleCollapseClick = (e) => {
            if (expandedAnime &&
                !e.target.closest('.anime-card') &&
                !e.target.closest('.tab-item') &&
                !e.target.closest('.trailer-portal-container')) {
                setExpandedAnime(null);
            }
        };
        document.addEventListener('mousedown', handleCollapseClick);
        return () => document.removeEventListener('mousedown', handleCollapseClick);
    }, [expandedAnime]);

    // Initial data load: today schedule + cached watching → then fresh watching in bg
    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            let cachedWatching = [];
            try {
                const cached = JSON.parse(localStorage.getItem(WATCHING_CACHE_KEY) || '[]');
                if (cached.length > 0 && typeof cached[0] === 'object') cachedWatching = cached;
            } catch {
                localStorage.removeItem(WATCHING_CACHE_KEY);
            }
            if (isMounted) setUserWatching(cachedWatching);

            try {
                const tData = await fetchDaySchedule(todayFilter);
                if (isMounted) { setTodayData(tData); setTodayError(false); }
            } catch {
                if (isMounted) setTodayError(true);
            } finally {
                if (isMounted) setTodayLoading(false);
            }

            try {
                const freshWatching = await fetchUserWatchingList(malUsername);
                if (freshWatching) {
                    if (freshWatching.length > 0) {
                        localStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify(freshWatching));
                    } else if (!malUsername) {
                        localStorage.removeItem(WATCHING_CACHE_KEY);
                    }
                    if (isMounted) setUserWatching(freshWatching);
                }
            } catch {
                // Silently fall back to cached
            }
        };

        const timerId = setTimeout(loadInitialData, 1000);

        const handleClickOutside = (e) => {
            if (!document.contains(e.target)) return;
            if (
                sidebarRef.current && !sidebarRef.current.contains(e.target) &&
                toggleRef.current && !toggleRef.current.contains(e.target) &&
                !e.target.closest('.trailer-portal-container')
            ) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            isMounted = false;
            clearTimeout(timerId);
            document.removeEventListener('click', handleClickOutside);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // MAL username change → debounced refresh
    useEffect(() => {
        if (malUsername === prevMalUsername.current) return;
        prevMalUsername.current = malUsername;

        let isMounted = true;
        let successTimeoutId = null;
        setMalError(false);
        setMalSuccess(false);

        if (!malUsername || malUsername.trim() === '') return;

        const refreshWatching = async () => {
            if (isMounted) setMalLoading(true);
            try {
                const freshWatching = await fetchUserWatchingList(malUsername);
                if (freshWatching) {
                    if (freshWatching.length > 0) {
                        localStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify(freshWatching));
                    } else {
                        localStorage.removeItem(WATCHING_CACHE_KEY);
                    }
                    if (isMounted) {
                        setUserWatching(freshWatching);
                        setMalError(false);
                        setMalSuccess(true);
                        successTimeoutId = setTimeout(() => {
                            if (isMounted) setMalSuccess(false);
                        }, 3000);
                    }
                }
            } catch {
                if (isMounted) { setMalError(true); setMalSuccess(false); }
            } finally {
                if (isMounted) setMalLoading(false);
            }
        };

        const timeoutId = setTimeout(refreshWatching, 500);
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (successTimeoutId) clearTimeout(successTimeoutId);
        };
    }, [malUsername, setMalError, setMalLoading, setMalSuccess]);

    // Sidebar day change → fetch that day's schedule
    useEffect(() => {
        if (!isSidebarOpen) return;
        let isMounted = true;
        const loadSidebarData = async () => {
            setSidebarLoading(true);
            setSidebarError(false);
            try {
                const data = await fetchDaySchedule(activeDay);
                const uniqueSorted = Array.from(new Map(data.map(item => [item.mal_id, item])).values())
                    .filter(a => a.broadcast && a.broadcast.time)
                    .sort((a, b) => a.broadcast.time.localeCompare(b.broadcast.time));
                if (isMounted) setSidebarData(uniqueSorted);
            } catch {
                if (isMounted) setSidebarError(true);
            } finally {
                if (isMounted) setSidebarLoading(false);
            }
        };
        loadSidebarData();
        return () => { isMounted = false; };
    }, [activeDay, isSidebarOpen]);

    // Trailer: auto-unmute when a new trailer opens (if user preference is unmuted)
    useEffect(() => {
        if (!previewTrailer || trailerMuted) return;
        const timer = setTimeout(() => {
            const iframe = trailerIframeRef.current;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), '*');
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [previewTrailer, trailerMuted, volume]);

    // Trailer: live volume sync
    useEffect(() => {
        if (!previewTrailer || trailerMuted) return;
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), '*');
        }
    }, [volume, previewTrailer, trailerMuted]);

    // Derived: today display list (watching-prioritized top-5)
    const userWatchingIds = userWatching.map(u => u.mal_id);
    const displayList = (() => {
        if (!todayData || todayData.length === 0) return [];
        const watchedToday = todayData
            .filter(a => userWatchingIds.includes(a.mal_id))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        if (watchedToday.length >= 5) return watchedToday;
        const othersToday = todayData
            .filter(a => !userWatchingIds.includes(a.mal_id))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        return [...watchedToday, ...othersToday.slice(0, 5 - watchedToday.length)];
    })();

    // Trailer hover handlers
    const handleMouseEnter = useCallback((e, anime) => {
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
        if (!yid) { setPreviewTrailer(null); return; }

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
            if (x + previewWidth > window.innerWidth - 10) x = rect.left - previewWidth - 20;
        }
        y = rect.top + (rect.height / 2) - (previewHeight / 2);
        y = Math.max(10, Math.min(y, window.innerHeight - previewHeight - 10));
        x = Math.max(10, x);

        hoverTimer.current = setTimeout(() => {
            setPreviewTrailer(yid);
            setPreviewPos({ x, y });
        }, 400);
    }, []);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(hoverTimer.current);
        hideTimer.current = setTimeout(() => setPreviewTrailer(null), 300);
    }, []);

    const handleTrailerMouseEnter = useCallback(() => clearTimeout(hideTimer.current), []);

    const handleTrailerMouseLeave = useCallback(() => {
        hideTimer.current = setTimeout(() => setPreviewTrailer(null), 300);
    }, []);

    const handleUnmute = useCallback(() => {
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), '*');
        }
        setTrailerMuted(false);
        localStorage.setItem('dash_trailer_muted', 'false');
    }, [volume]);

    const handleMute = useCallback(() => {
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
        }
        setTrailerMuted(true);
        localStorage.setItem('dash_trailer_muted', 'true');
    }, []);

    return {
        // sidebar
        isSidebarOpen, setIsSidebarOpen,
        activeDay, setActiveDay,
        sidebarData, sidebarLoading, sidebarError,
        sidebarRef, toggleRef,
        // today list
        todayLoading, todayError,
        displayList,
        userWatchingIds,
        // expand
        expandedAnime, setExpandedAnime,
        // trailer
        previewTrailer, previewPos,
        trailerMuted,
        trailerIframeRef,
        handleMouseEnter, handleMouseLeave,
        handleTrailerMouseEnter, handleTrailerMouseLeave,
        handleUnmute, handleMute,
    };
}
