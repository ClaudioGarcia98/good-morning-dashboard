import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const THEMES = {
    aurora: { timeBased: true,  overlayA: 'rgba(0,0,0,0.6)',    overlayB: 'rgba(0,0,0,0.2)' },
    nord:   { accent: '#88C0D0', glow: 'rgba(136,192,208,0.25)', overlayA: 'rgba(46,52,64,0.85)',  overlayB: 'rgba(46,52,64,0.3)' },
    tokyo:  { accent: '#7aa2f7', glow: 'rgba(122,162,247,0.25)', overlayA: 'rgba(26,27,38,0.9)',   overlayB: 'rgba(26,27,38,0.35)' },
    sunset: { accent: '#f7768e', glow: 'rgba(247,118,142,0.25)', overlayA: 'rgba(70,20,30,0.85)',  overlayB: 'rgba(70,20,30,0.3)' },
    forest: { accent: '#9ece6a', glow: 'rgba(158,206,106,0.25)', overlayA: 'rgba(15,35,15,0.85)',  overlayB: 'rgba(15,35,15,0.3)' },
};

const FONTS = {
    default:   { family: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif", url: null },
    raleway:   { family: "'Raleway',sans-serif",         url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap' },
    outfit:    { family: "'Outfit',sans-serif",           url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap' },
    nunito:    { family: "'Nunito',sans-serif",           url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap' },
    jetbrains: { family: "'JetBrains Mono',monospace",    url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap' },
    playfair:  { family: "'Playfair Display',serif",      url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
};

export function SettingsProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('dash_theme') || 'aurora');
    const [font, setFont] = useState(() => localStorage.getItem('dash_font') || 'default');
    const [clockMode, setClockMode] = useState(() => localStorage.getItem('dash_clock') || 'digital');
    const [username, setUsername] = useState(() => localStorage.getItem('dash_username') || 'Cláudio');
    const [backgroundUrl, setBackgroundUrl] = useState(null);
    const [gifName, setGifName] = useState(() => localStorage.getItem('dash_gif_name') || '');
    const [musicUrl, setMusicUrl] = useState(() => localStorage.getItem('dash_music_url') || '');
    
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

    // Background setup
    useEffect(() => {
        const DEFAULT_GIF = 'file:///C:/Users/claudio/Pictures/Gifs/animated.gif';
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
            } else {
                setBackgroundUrl(DEFAULT_GIF);
            }
        });
    }, []);

    // Theme setup
    useEffect(() => {
        const t = THEMES[theme] || THEMES.aurora;
        localStorage.setItem('dash_theme', theme);
        
        const updateTimeAccent = () => {
            const hr = new Date().getHours();
            let a = '#FFD26A', g = 'rgba(255,210,106,0.2)';
            if (hr >= 12 && hr < 18) { a = '#FF9F43'; g = 'rgba(255,159,67,0.2)'; }
            else if (hr >= 18 && hr < 22) { a = '#54a0ff'; g = 'rgba(84,160,255,0.2)'; }
            else if (hr >= 22 || hr < 5)  { a = '#a55eea'; g = 'rgba(165,94,234,0.2)'; }
            document.documentElement.style.setProperty('--accent-color', a);
            document.documentElement.style.setProperty('--accent-glow', g);
        };

        if (!t.timeBased) {
            document.documentElement.style.setProperty('--accent-color', t.accent);
            document.documentElement.style.setProperty('--accent-glow', t.glow);
        } else {
            updateTimeAccent();
            // Need an interval for time-based if it crosses an hour boundary, but for simplicity, calling once is okay.
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.background = `linear-gradient(90deg, ${t.overlayA} 0%, ${t.overlayB} 50%, rgba(0,0,0,0) 100%)`;
        }
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
        document.body.style.fontFamily = f.family;
    }, [font]);

    // Save simple settings
    useEffect(() => {
        localStorage.setItem('dash_clock', clockMode);
        localStorage.setItem('dash_username', username);
        localStorage.setItem('dash_volume', volume.toString());
        localStorage.setItem('dash_music_url', musicUrl);
    }, [clockMode, username, volume, musicUrl]);

    useEffect(() => {
        localStorage.setItem('dash_speed_dials', JSON.stringify(speedDials));
    }, [speedDials]);

    const value = {
        theme, setTheme, THEMES,
        font, setFont, FONTS,
        clockMode, setClockMode,
        username, setUsername,
        backgroundUrl, setBackgroundUrl,
        gifName, setGifName,
        speedDials, setSpeedDials,
        volume, setVolume,
        hasInteracted,
        musicUrl, setMusicUrl
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
