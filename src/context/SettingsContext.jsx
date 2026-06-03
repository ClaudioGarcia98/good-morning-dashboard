import { useState, useEffect, useMemo } from 'react';
import { THEMES, FONTS } from './settingsConstants';
import { SettingsContext } from './Context';

export function SettingsProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('dash_theme') || 'aurora');
    const [font, setFont] = useState(() => localStorage.getItem('dash_font') || 'default');
    const [clockMode, setClockMode] = useState(() => localStorage.getItem('dash_clock') || 'digital');
    const [username, setUsername] = useState(() => localStorage.getItem('dash_username') || 'Cláudio');
    const [fallbackCity, setFallbackCity] = useState(() => localStorage.getItem('dash_fallback_city') || 'Bombarral');
    const [backgroundUrl, setBackgroundUrl] = useState(null);
    const [backgroundIsVideo, setBackgroundIsVideo] = useState(false);
    const [gifName, setGifName] = useState(() => localStorage.getItem('dash_gif_name') || '');
    const [lofiId, setLofiId] = useState(() => localStorage.getItem('dash_lofi_id') || 'Gu-g8FRG4Zs');
    const [customLofiId, setCustomLofiId] = useState(() => localStorage.getItem('dash_custom_lofi') || localStorage.getItem('dash_lofi_id') || 'Gu-g8FRG4Zs');
    
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('dash_volume');
        return saved ? parseFloat(saved) : 0.2;
    });
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        const handleInteract = () => {
            setHasInteracted(true);
            window.removeEventListener('click', handleInteract);
            window.removeEventListener('keydown', handleInteract);
        };
        window.addEventListener('click', handleInteract);
        window.addEventListener('keydown', handleInteract);
        return () => {
            window.removeEventListener('click', handleInteract);
            window.removeEventListener('keydown', handleInteract);
        };
    }, []);

    const [speedDials, setSpeedDials] = useState(() => {
        const cached = localStorage.getItem('dash_speed_dials');
        if (cached) return JSON.parse(cached);
        return [
            { id: 1, name: 'YouTube', url: 'https://youtube.com' },
            { id: 2, name: 'Crunchyroll', url: 'https://crunchyroll.com' },
            { id: 3, name: 'Netflix', url: 'https://netflix.com' },
            { id: 4, name: 'MyAnimeList', url: 'https://myanimelist.net/animelist/claclo98' }
        ];
    });

    const [customEngines, setCustomEngines] = useState(() => {
        const cached = localStorage.getItem('dash_custom_engines');
        if (cached) return JSON.parse(cached);
        return [];
    });

    // Background setup
    useEffect(() => {
        const DEFAULT_GIF = 'https://video.r2.moele.me/v/29642/29632082_a-01.mp4';
        const loadBlob = async () => {
            try {
                const db = await new Promise((res, rej) => {
                    const r = indexedDB.open('dashDB', 1);
                    r.onupgradeneeded = e => e.target.result.createObjectStore('s');
                    r.onsuccess = e => res(e.target.result);
                    r.onerror = e => rej(e.target.error);
                });
                return new Promise((res, rej) => {
                    const r = db.transaction('s', 'readonly').objectStore('s').get('bg');
                    r.onsuccess = e => res(e.target.result || null);
                    r.onerror = e => rej(e.target.error);
                });
            } catch { return null; }
        };
        
        loadBlob().then(blob => {
            if (blob) {
                setBackgroundUrl(URL.createObjectURL(blob));
                setBackgroundIsVideo(blob.type && blob.type.startsWith('video/'));
            } else {
                setBackgroundUrl(DEFAULT_GIF);
                setBackgroundIsVideo(DEFAULT_GIF.endsWith('.mp4'));
            }
        });
    }, []);

    // Cleanup blob URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (backgroundUrl && backgroundUrl.startsWith('blob:')) {
                URL.revokeObjectURL(backgroundUrl);
            }
        };
    }, [backgroundUrl]);

    // Theme setup
    useEffect(() => {
        let intervalId;
        const t = THEMES[theme] || THEMES.aurora;
        localStorage.setItem('dash_theme', theme);
        
        const updateTimeAccent = () => {
            const hr = new Date().getHours();
            let a = '#FFD26A', g = 'rgba(255,210,106,0.2)';
            if (hr >= 12 && hr < 18) { a = '#FF9F43'; g = 'rgba(255,159,67,0.2)'; }
            else if (hr >= 18 && hr < 22) { a = '#54a0ff'; g = 'rgba(84,160,255,0.2)'; }
            else if (hr >= 22 || hr < 5)  { a = '#c482fb'; g = 'rgba(196,130,251,0.25)'; }
            document.documentElement.style.setProperty('--accent-color', a);
            document.documentElement.style.setProperty('--accent-glow', g);
        };

        if (!t.timeBased) {
            document.documentElement.style.setProperty('--accent-color', t.accent);
            document.documentElement.style.setProperty('--accent-glow', t.glow);
        } else {
            updateTimeAccent();
            intervalId = setInterval(updateTimeAccent, 60000); // check every minute
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.background = `linear-gradient(90deg, ${t.overlayA} 0%, ${t.overlayB} 50%, rgba(0,0,0,0) 100%)`;
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [theme]);

    // Font setup
    useEffect(() => {
        const f = FONTS[font] || FONTS.default;
        localStorage.setItem('dash_font', font);
        
        if (f.url && !document.getElementById('gf-' + font)) {
            const l = document.createElement('link');
            l.id = 'gf-' + font; l.rel = 'stylesheet'; l.href = f.url;
            document.head.appendChild(l);
        }
        document.documentElement.style.setProperty('--font-family', f.family);
    }, [font]);

    // Save simple settings
    useEffect(() => {
        localStorage.setItem('dash_clock', clockMode);
        localStorage.setItem('dash_username', username);
        localStorage.setItem('dash_volume', volume.toString());
        localStorage.setItem('dash_lofi_id', lofiId);
        localStorage.setItem('dash_custom_lofi', customLofiId);
        localStorage.setItem('dash_fallback_city', fallbackCity);
    }, [clockMode, username, volume, lofiId, customLofiId, fallbackCity]);

    useEffect(() => {
        localStorage.setItem('dash_speed_dials', JSON.stringify(speedDials));
    }, [speedDials]);

    useEffect(() => {
        localStorage.setItem('dash_custom_engines', JSON.stringify(customEngines));
    }, [customEngines]);

    const value = useMemo(() => ({
        theme, setTheme, THEMES,
        font, setFont, FONTS,
        clockMode, setClockMode,
        username, setUsername,
        backgroundUrl, setBackgroundUrl,
        backgroundIsVideo, setBackgroundIsVideo,
        gifName, setGifName,
        speedDials, setSpeedDials,
        volume, setVolume,
        hasInteracted,
        customEngines, setCustomEngines,
        lofiId, setLofiId,
        customLofiId, setCustomLofiId,
        fallbackCity, setFallbackCity
    }), [
        theme, font, clockMode, username, backgroundUrl, backgroundIsVideo, 
        gifName, speedDials, volume, hasInteracted, customEngines, lofiId, customLofiId, fallbackCity
    ]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
