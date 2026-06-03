import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSettings } from '../context/useSettings';

export default React.memo(function SettingsPanel() {
    const {
        theme, setTheme, THEMES,
        font, setFont, FONTS,
        clockMode, setClockMode,
        username, setUsername,
        malUsername, setMalUsername,
        malError,
        malLoading,
        malSuccess,
        setBackgroundUrl,
        gifName, setGifName,
        speedDials, setSpeedDials,
        volume, setVolume,
        customEngines, setCustomEngines,
        setBackgroundIsVideo,
        setLofiId,
        customLofiId, setCustomLofiId,
        fallbackCity, setFallbackCity,
        use24hClock, setUse24hClock,
        useCelsius, setUseCelsius
    } = useSettings();

    const [isOpen, setIsOpen] = useState(false);
    const [newDialUrl, setNewDialUrl] = useState('');
    
    const [editingDialId, setEditingDialId] = useState(null);
    const [editDialName, setEditDialName] = useState('');
    const [editDialUrl, setEditDialUrl] = useState('');


    const [citySearchText, setCitySearchText] = useState(fallbackCity);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    
    // Local state for immediate typing before applying
    const [tempLofi, setTempLofi] = useState(customLofiId);
    const [prevCustomLofi, setPrevCustomLofi] = useState(customLofiId);

    if (customLofiId !== prevCustomLofi) {
        setPrevCustomLofi(customLofiId);
        setTempLofi(customLofiId);
    }
    
    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const fileInputRef = useRef(null);
    const cityHintRef = useRef(null);
    const [cityHintPos, setCityHintPos] = useState(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) &&
                toggleRef.current && !toggleRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const closeOnIdle = () => setIsOpen(false);
        const openDials = () => {
            setIsOpen(true);
            setTimeout(() => {
                if (panelRef.current) {
                    const section = panelRef.current.querySelector('#dials-settings-section');
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                }
            }, 150);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('app-idle', closeOnIdle);
        window.addEventListener('open-settings-dials', openDials);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('app-idle', closeOnIdle);
            window.removeEventListener('open-settings-dials', openDials);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setCitySearchText(fallbackCity);
            setShowCityDropdown(false);
        }
    }, [isOpen, fallbackCity]);

    useEffect(() => {
        if (citySearchText === fallbackCity || !showCityDropdown) return;
        const delayDebounceFn = setTimeout(async () => {
            if (citySearchText.length > 2) {
                setIsSearchingCity(true);
                try {
                    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(citySearchText)}&count=5`);
                    const data = await res.json();
                    setCitySuggestions(data.results || []);
                } catch (e) {
                    setCitySuggestions([]);
                }
                setIsSearchingCity(false);
            } else {
                setCitySuggestions([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [citySearchText, fallbackCity, showCityDropdown]);

    const saveBlob = async (blob) => {
        const db = await new Promise((res, rej) => {
            const r = indexedDB.open('dashDB', 1);
            r.onupgradeneeded = e => e.target.result.createObjectStore('s');
            r.onsuccess = e => res(e.target.result);
            r.onerror = e => rej(e.target.error);
        });
        return new Promise((res, rej) => {
            const tx = db.transaction('s', 'readwrite');
            tx.objectStore('s').put(blob, 'bg');
            tx.oncomplete = res;
            tx.onerror = e => rej(e.target.error);
        });
    };

    const handleFileChange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        await saveBlob(f);
        setBackgroundUrl(URL.createObjectURL(f));
        setBackgroundIsVideo(f.type && f.type.startsWith('video/'));
        localStorage.setItem('dash_gif_name', f.name);
        setGifName(f.name);
    };

    const handleAddDial = () => {
        if (!newDialUrl.trim()) return;
        let url = newDialUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        
        let finalName;
        try {
            const host = new URL(url).hostname.replace('www.', '').split('.')[0];
            finalName = host.charAt(0).toUpperCase() + host.slice(1);
        } catch {
            finalName = 'Speed Dial';
        }

        const newDial = {
            id: Date.now(),
            name: finalName,
            url: url
        };
        setSpeedDials(prev => [...prev, newDial]);
        setNewDialUrl('');
    };


    const handleRemoveDial = (id) => {
        setSpeedDials(prev => prev.filter(d => d.id !== id));
    };

    const handleRemoveEngine = (id) => {
        setCustomEngines(prev => prev.filter(e => e.id !== id));
    };

    const handleSaveLofi = () => {
        let val = tempLofi.trim();
        // Extract video ID if user pasted a full YouTube URL
        const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match) {
            val = match[1];
        }
        setCustomLofiId(val);
        setLofiId(val);
    };

    return (
        <>
            <button 
                className={`settings-toggle ${isOpen ? 'open' : ''}`}
                id="settingsToggle" 
                title="Settings"
                ref={toggleRef}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Settings Panel"
                aria-expanded={isOpen}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
            </button>
            <section className={`settings-panel ${isOpen ? 'open' : ''}`} id="settingsPanel" ref={panelRef}>
                <div className="sp-title">⚙ Settings</div>
                
                <div className="sp-section">
                    <div className="sp-label">Profile</div>
                    <div className="sp-group">
                        <label htmlFor="usernameInput">Display Name</label>
                        <input 
                            type="text" 
                            id="usernameInput" 
                            placeholder="Your name" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="sp-group" style={{ marginTop: '10px' }}>
                        <label htmlFor="malUsernameInput">MyAnimeList Username</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                id="malUsernameInput" 
                                className={malError ? 'mal-error' : (malSuccess ? 'mal-success' : '')}
                                placeholder="MAL username (e.g., claclo98)" 
                                value={malUsername}
                                onChange={(e) => setMalUsername(e.target.value)}
                                style={{ paddingRight: '30px' }}
                            />
                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                {malLoading && !malError && !malSuccess && (
                                    <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transformOrigin: 'center' }}>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                    </svg>
                                )}
                                {malError && !malLoading && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                )}
                                {malSuccess && !malLoading && !malError && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                            </div>
                        </div>
                        {malError && !malLoading && (
                            <div style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '4px', paddingLeft: '2px' }}>
                                Username not found or failed to load.
                            </div>
                        )}
                        {malSuccess && !malLoading && !malError && (
                            <div style={{ color: '#4caf50', fontSize: '11px', marginTop: '4px', paddingLeft: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Verified
                            </div>
                        )}
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Weather</div>
                    <div className="sp-group" style={{ position: 'relative' }}>
                        <label htmlFor="fallbackCityInput" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Your City
                            <span 
                                ref={cityHintRef}
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help', lineHeight: 1 }}
                                onMouseEnter={() => {
                                    if (cityHintRef.current) {
                                        const rect = cityHintRef.current.getBoundingClientRect();
                                        setCityHintPos({ top: rect.bottom + 8, left: rect.left });
                                    }
                                }}
                                onMouseLeave={() => setCityHintPos(null)}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </span>
                            {cityHintPos && ReactDOM.createPortal(
                                <div className="settings-hint-card" style={{ top: cityHintPos.top, left: cityHintPos.left }}>
                                    <p>This is only used when your browser's GPS location is unavailable or denied.</p>
                                </div>,
                                document.body
                            )}
                        </label>
                        <input 
                            type="text" 
                            id="fallbackCityInput" 
                            placeholder="e.g. London" 
                            value={citySearchText}
                            onChange={(e) => {
                                setCitySearchText(e.target.value);
                                setShowCityDropdown(true);
                            }}
                            onFocus={() => { if (citySearchText) setShowCityDropdown(true); }}
                        />
                        {showCityDropdown && (citySuggestions.length > 0 || isSearchingCity) && (
                            <ul className="city-suggestions-dropdown">
                                {isSearchingCity ? (
                                    <li className="city-suggestion-item">Searching...</li>
                                ) : (
                                    citySuggestions.map((s, i) => (
                                        <li 
                                            key={i} 
                                            className="city-suggestion-item"
                                            onClick={() => {
                                                const fullName = `${s.name}${s.admin1 ? ', ' + s.admin1 : ''}, ${s.country}`;
                                                setCitySearchText(fullName);
                                                setFallbackCity(fullName);
                                                setShowCityDropdown(false);
                                            }}
                                        >
                                            <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                                            {s.admin1 && <span style={{ opacity: 0.7 }}>, {s.admin1}</span>}
                                            <span style={{ opacity: 0.5, marginLeft: '4px' }}>({s.country})</span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Theme</div>
                    <div className="pill-row">
                        {Object.keys(THEMES).map(t => (
                            <button 
                                key={t}
                                className={`pill ${theme === t ? 'active' : ''}`}
                                onClick={() => setTheme(t)}
                            >
                                <span className="tdot" style={{ background: THEMES[t].accent || '#FFD26A' }}></span>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Font</div>
                    <div className="pill-row">
                        {Object.keys(FONTS).map(f => (
                            <button 
                                key={f}
                                className={`pill ${font === f ? 'active' : ''}`}
                                onClick={() => setFont(f)}
                                style={{ fontFamily: FONTS[f].family }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Clock Style</div>
                    <div className="pill-row">
                        {['digital', 'analog', 'both'].map(m => (
                            <button 
                                key={m}
                                className={`pill ${clockMode === m ? 'active' : ''}`}
                                onClick={() => setClockMode(m)}
                            >
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Clock Format</div>
                    <div className="pill-row">
                        <button 
                            className={`pill ${!use24hClock ? 'active' : ''}`}
                            onClick={() => setUse24hClock(false)}
                        >
                            12-Hour
                        </button>
                        <button 
                            className={`pill ${use24hClock ? 'active' : ''}`}
                            onClick={() => setUse24hClock(true)}
                        >
                            24-Hour
                        </button>
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Media Volume</div>
                    <div className="sp-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>}
                            {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>}
                        </svg>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            style={{ flex: 1, height: '4px', accentColor: 'var(--accent-color, #00ffcc)', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, width: '32px', textAlign: 'right' }}>
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Background</div>
                    <div 
                        className="gif-btn" 
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <span>🎞</span><span>{gifName ? 'Change GIF…' : 'Choose local GIF…'}</span>
                    </div>
                    <div className="gif-name">{gifName || 'No background set'}</div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/gif,image/webp,image/png,image/jpeg,video/mp4"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="sp-section">
                    <div className="sp-label">Lofi Player</div>
                    <div className="sp-group">
                        <label htmlFor="lofiInput">YouTube Video ID or URL</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                id="lofiInput" 
                                placeholder="e.g. jfKfPfyJRdk" 
                                value={tempLofi}
                                onChange={(e) => setTempLofi(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveLofi()}
                                style={{ flex: 1 }}
                            />
                            <button className="pill" onClick={handleSaveLofi}>Save</button>
                        </div>
                    </div>
                </div>

                <div className="sp-section" id="dials-settings-section">
                    <div className="sp-label">Speed Dials</div>
                    <div className="sp-group">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input 
                                type="text" 
                                placeholder="Paste URL here..." 
                                value={newDialUrl}
                                onChange={e => setNewDialUrl(e.target.value)}
                                style={{ flex: 1 }}
                                onKeyDown={e => e.key === 'Enter' && handleAddDial()}
                            />
                            <button className="pill" onClick={handleAddDial}>Add</button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {speedDials.map(dial => (
                                <li key={dial.id} className="sp-list-item" style={{ flexDirection: editingDialId === dial.id ? 'column' : 'row', gap: '8px', fontSize: '0.8rem' }}>
                                    {editingDialId === dial.id ? (
                                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                            <input 
                                                type="text" 
                                                value={editDialName}
                                                onChange={e => setEditDialName(e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <input 
                                                type="text" 
                                                value={editDialUrl}
                                                onChange={e => setEditDialUrl(e.target.value)}
                                                style={{ flex: 2 }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        setSpeedDials(speedDials.map(d => d.id === dial.id ? { ...d, name: editDialName, url: editDialUrl } : d));
                                                        setEditingDialId(null);
                                                    }
                                                }}
                                            />
                                            <button className="pill" onClick={() => {
                                                setSpeedDials(speedDials.map(d => d.id === dial.id ? { ...d, name: editDialName, url: editDialUrl } : d));
                                                setEditingDialId(null);
                                            }}>Save</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
                                                <img src={`https://www.google.com/s2/favicons?domain=${new URL(dial.url).hostname}&sz=16`} style={{ width: 16, height: 16, borderRadius: 3 }} onError={e => e.target.style.display='none'} alt="" />
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{dial.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <button 
                                                    onClick={() => {
                                                        setEditingDialId(dial.id);
                                                        setEditDialName(dial.name);
                                                        setEditDialUrl(dial.url);
                                                    }} 
                                                    className="sp-action-btn"
                                                    title="Edit"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"></path>
                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleRemoveDial(dial.id)} className="sp-action-btn delete" title="Delete">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="sp-section" style={{ marginTop: '15px' }}>
                        <div className="sp-label">Temperature Unit</div>
                        <div className="pill-row">
                            <button 
                                className={`pill ${useCelsius ? 'active' : ''}`}
                                onClick={() => setUseCelsius(true)}
                            >
                                Celsius (°C)
                            </button>
                            <button 
                                className={`pill ${!useCelsius ? 'active' : ''}`}
                                onClick={() => setUseCelsius(false)}
                            >
                                Fahrenheit (°F)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Keyboard Shortcuts</div>
                    <div className="shortcut-list">
                        <div className="shortcut-item"><span>Focus Search</span><kbd>Ctrl + Space</kbd></div>
                        <div className="shortcut-item"><span>Close Suggestions</span><kbd>Esc</kbd></div>
                        <div className="shortcut-item"><span>Navigate List</span><kbd>↑ / ↓</kbd></div>
                        <div className="shortcut-item"><span>Clear Engine Prefix</span><kbd>Backspace</kbd></div>
                    </div>
                    <div className="sp-label" style={{ marginTop: '15px' }}>Search Prefixes</div>
                    <div className="prefix-grid">
                        <div className="prefix-item"><code>g </code><span>Google</span></div>
                        <div className="prefix-item"><code>yt </code><span>YouTube</span></div>
                        <div className="prefix-item"><code>r </code><span>Reddit</span></div>
                        <div className="prefix-item"><code>gh </code><span>GitHub</span></div>
                        <div className="prefix-item"><code>ddg </code><span>DuckDuckGo</span></div>
                        <div className="prefix-item"><code>wiki </code><span>Wikipedia</span></div>
                        <div className="prefix-item"><code>mdn </code><span>MDN</span></div>
                        <div className="prefix-item"><code>tw </code><span>Twitter/X</span></div>
                        <div className="prefix-item"><code>a </code><span>Amazon</span></div>
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Danger Zone</div>
                    <button 
                        className="reset-btn"
                        onClick={() => setConfirmReset(1)}
                    >
                        🗑 Reset All Settings
                    </button>
                </div>
            </section>

            {confirmReset && ReactDOM.createPortal(
                <div className="reset-overlay" onClick={() => setConfirmReset(false)}>
                    <div className="reset-modal" onClick={e => e.stopPropagation()}>
                        {confirmReset === 1 ? (
                            <>
                                <p>Are you sure you want to reset all settings?</p>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>This will clear all your preferences, speed dials, and saved data.</span>
                                <div className="reset-modal-actions">
                                    <button className="pill" onClick={() => setConfirmReset(false)}>Cancel</button>
                                    <button className="reset-confirm-btn" onClick={() => setConfirmReset(2)}>Yes, Reset</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p>⚠️ This cannot be undone</p>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>All settings, cached location, background, and stored data will be permanently erased. The page will reload.</span>
                                <div className="reset-modal-actions">
                                    <button className="pill" onClick={() => setConfirmReset(false)}>Go Back</button>
                                    <button className="reset-confirm-btn" onClick={async () => {
                                        // Clear all storage
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        
                                        // Clear IndexedDB
                                        indexedDB.deleteDatabase('dashDB');
                                        
                                        // Clear all caches
                                        if ('caches' in window) {
                                            const names = await caches.keys();
                                            await Promise.all(names.map(n => caches.delete(n)));
                                        }
                                        
                                        // Unregister service workers
                                        if ('serviceWorker' in navigator) {
                                            const regs = await navigator.serviceWorker.getRegistrations();
                                            await Promise.all(regs.map(r => r.unregister()));
                                        }
                                        
                                        window.location.reload();
                                    }}>Yes, Erase Everything</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
});
