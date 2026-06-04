import { memo, useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import logoUrl from '../../assets/logo.png';
import ThemeSettings from './ThemeSettings';
import WidgetToggles from './WidgetToggles';
import MediaSettings from './MediaSettings';

const getFaviconUrl = (url) => {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=16`; }
    catch { return ''; }
};

export default memo(function SettingsPanel() {
    const {
        username, setUsername,
        malUsername, setMalUsername,
        malError, malLoading, malSuccess,
        speedDials, setSpeedDials,
        fallbackCity, setFallbackCity,
        useCelsius, setUseCelsius,
    } = useSettingsStore(useShallow(s => ({
        username: s.username, setUsername: s.setUsername,
        malUsername: s.malUsername, setMalUsername: s.setMalUsername,
        malError: s.malError, malLoading: s.malLoading, malSuccess: s.malSuccess,
        speedDials: s.speedDials, setSpeedDials: s.setSpeedDials,
        fallbackCity: s.fallbackCity, setFallbackCity: s.setFallbackCity,
        useCelsius: s.useCelsius, setUseCelsius: s.setUseCelsius,
    })));

    const [isOpen, setIsOpen] = useState(false);
    const [newDialUrl, setNewDialUrl] = useState('');
    const [editingDialId, setEditingDialId] = useState(null);
    const [editDialName, setEditDialName] = useState('');
    const [editDialUrl, setEditDialUrl] = useState('');
    const [citySearchText, setCitySearchText] = useState(fallbackCity);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [cityHintPos, setCityHintPos] = useState(null);
    const [confirmReset, setConfirmReset] = useState(0);
    const [popupMessage, setPopupMessage] = useState(null);

    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const cityHintRef = useRef(null);
    const importFileInputRef = useRef(null);

    // Panel close-on-click-outside, idle, and open-dials scroll
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

    // Sync city input when panel closes
    useEffect(() => {
        if (!isOpen) {
            setCitySearchText(fallbackCity);
            setShowCityDropdown(false);
        }
    }, [isOpen, fallbackCity]);

    // Debounced city geocoding
    useEffect(() => {
        if (citySearchText === fallbackCity || !showCityDropdown) return;
        const delayDebounceFn = setTimeout(async () => {
            if (citySearchText.length > 2) {
                setIsSearchingCity(true);
                try {
                    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(citySearchText)}&count=5`);
                    const data = await res.json();
                    setCitySuggestions(data.results || []);
                } catch {
                    setCitySuggestions([]);
                }
                setIsSearchingCity(false);
            } else {
                setCitySuggestions([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [citySearchText, fallbackCity, showCityDropdown]);

    const handleExportSettings = () => {
        const settings = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('dash_')) settings[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `good_morning_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportSettings = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const settings = JSON.parse(evt.target.result);
                const keys = Object.keys(settings);
                if (keys.length === 0 || !keys.some(k => k.startsWith('dash_'))) {
                    setPopupMessage({ title: 'Import Failed', message: 'Invalid backup file format. Please ensure you are uploading a valid Good Morning backup file.', type: 'error' });
                    return;
                }
                keys.forEach(k => { if (k.startsWith('dash_')) localStorage.setItem(k, settings[k]); });
                setPopupMessage({
                    title: 'Success!',
                    message: 'Your settings and customization have been successfully restored. The dashboard needs to reload to apply the changes.',
                    type: 'success',
                    onAction: () => window.location.reload(),
                });
            } catch {
                setPopupMessage({ title: 'Import Failed', message: 'Failed to parse the backup file. It might be corrupted.', type: 'error' });
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAddDial = () => {
        if (!newDialUrl.trim()) return;
        let url = newDialUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        let finalName;
        try {
            const host = new URL(url).hostname.replace('www.', '').split('.')[0];
            finalName = host.charAt(0).toUpperCase() + host.slice(1);
        } catch { finalName = 'Speed Dial'; }
        setSpeedDials(prev => [...prev, { id: Date.now(), name: finalName, url }]);
        setNewDialUrl('');
    };

    const handleRemoveDial = (id) => setSpeedDials(prev => prev.filter(d => d.id !== id));

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
                <div className="sp-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoUrl} alt="Aura Logo" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 8px var(--accent-color))' }} />
                    Aura Settings
                </div>

                {/* Profile */}
                <div className="sp-section">
                    <div className="sp-label">Profile</div>
                    <div className="sp-group">
                        <label htmlFor="usernameInput">Display Name</label>
                        <input type="text" id="usernameInput" placeholder="Your name" value={username} onChange={(e) => setUsername(e.target.value)} />
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
                                    <div className="spinner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '14px', height: '14px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                        </svg>
                                    </div>
                                )}
                                {malError && !malLoading && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                )}
                                {malSuccess && !malLoading && !malError && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                            </div>
                        </div>
                        {malError && !malLoading && <div style={{ color: '#ff6b6b', fontSize: '11px', marginTop: '4px', paddingLeft: '2px' }}>Username not found or failed to load.</div>}
                        {malSuccess && !malLoading && !malError && <div style={{ color: '#4caf50', fontSize: '11px', marginTop: '4px', paddingLeft: '2px' }}>Verified</div>}
                    </div>
                </div>

                <WidgetToggles />

                {/* Weather */}
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
                            onChange={(e) => { setCitySearchText(e.target.value); setShowCityDropdown(true); }}
                            onFocus={() => { if (citySearchText) setShowCityDropdown(true); }}
                        />
                        {showCityDropdown && (citySuggestions.length > 0 || isSearchingCity) && (
                            <ul className="city-suggestions-dropdown">
                                {isSearchingCity ? (
                                    <li className="city-suggestion-item">Searching...</li>
                                ) : (
                                    citySuggestions.map((s, i) => (
                                        <li key={i} className="city-suggestion-item" onClick={() => {
                                            const fullName = `${s.name}${s.admin1 ? ', ' + s.admin1 : ''}, ${s.country}`;
                                            setCitySearchText(fullName);
                                            setFallbackCity(fullName);
                                            setShowCityDropdown(false);
                                        }}>
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

                <ThemeSettings />

                <MediaSettings />

                {/* Speed Dials */}
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
                                            <input type="text" value={editDialName} onChange={e => setEditDialName(e.target.value)} style={{ flex: 1 }} />
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
                                                <img src={getFaviconUrl(dial.url)} style={{ width: 16, height: 16, borderRadius: 3 }} onError={e => e.target.style.display = 'none'} alt="" />
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{dial.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <button onClick={() => { setEditingDialId(dial.id); setEditDialName(dial.name); setEditDialUrl(dial.url); }} className="sp-action-btn" title="Edit">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleRemoveDial(dial.id)} className="sp-action-btn delete" title="Delete">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
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
                            <button className={`pill ${useCelsius ? 'active' : ''}`} onClick={() => setUseCelsius(true)}>Celsius (°C)</button>
                            <button className={`pill ${!useCelsius ? 'active' : ''}`} onClick={() => setUseCelsius(false)}>Fahrenheit (°F)</button>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts */}
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
                        <div className="prefix-item"><code>mal </code><span>MyAnimeList</span></div>
                    </div>
                </div>

                {/* Backup & Restore */}
                <div className="sp-section">
                    <div className="sp-label">Backup & Restore</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="pill" style={{ flex: 1, justifyContent: 'center' }} onClick={handleExportSettings}>⬇ Export Settings</button>
                        <button className="pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => importFileInputRef.current?.click()}>⬆ Import Settings</button>
                        <input type="file" accept=".json" ref={importFileInputRef} style={{ display: 'none' }} onChange={handleImportSettings} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: 1.4 }}>
                        Save your configuration, speed dials, and layout preferences to a file.
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="sp-section">
                    <div className="sp-label">Danger Zone</div>
                    <button className="reset-btn" onClick={() => setConfirmReset(1)}>🗑 Reset All Settings</button>
                </div>
            </section>

            {/* Reset confirm modal */}
            {confirmReset > 0 && ReactDOM.createPortal(
                <div className="reset-overlay" onClick={() => setConfirmReset(0)}>
                    <div className="reset-modal" onClick={e => e.stopPropagation()}>
                        {confirmReset === 1 ? (
                            <>
                                <p>Are you sure you want to reset all settings?</p>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>This will clear all your preferences, speed dials, and saved data.</span>
                                <div className="reset-modal-actions">
                                    <button className="pill" onClick={() => setConfirmReset(0)}>Cancel</button>
                                    <button className="reset-confirm-btn" onClick={() => setConfirmReset(2)}>Yes, Reset</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p>⚠️ This cannot be undone</p>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>All settings, cached location, background, and stored data will be permanently erased. The page will reload.</span>
                                <div className="reset-modal-actions">
                                    <button className="pill" onClick={() => setConfirmReset(0)}>Go Back</button>
                                    <button className="reset-confirm-btn" onClick={async () => {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        indexedDB.deleteDatabase('dashDB');
                                        if ('caches' in window) {
                                            const names = await caches.keys();
                                            await Promise.all(names.map(n => caches.delete(n)));
                                        }
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

            {/* Import/Export popup modal */}
            {popupMessage && ReactDOM.createPortal(
                <div className="reset-overlay" style={{ zIndex: 1000000, animation: 'fadeSlideIn 0.2s ease-out' }}>
                    <div className="reset-modal" style={{ textAlign: 'center', maxWidth: '350px', padding: '30px 24px', animation: 'pulseGlow 2s infinite' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '15px', lineHeight: 1, display: 'flex', justifyContent: 'center' }}>
                            {popupMessage.type === 'success' ? (
                                <img src={logoUrl} alt="Success" style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 0 15px var(--accent-color))' }} />
                            ) : '❌'}
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: popupMessage.type === 'error' ? '#ff6b6b' : 'var(--accent-color)' }}>{popupMessage.title}</h3>
                        <p style={{ fontSize: '0.95rem', opacity: 0.85, marginBottom: '25px', lineHeight: 1.5 }}>{popupMessage.message}</p>
                        <button
                            className="pill"
                            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', background: popupMessage.type === 'error' ? 'rgba(255, 107, 107, 0.15)' : 'var(--accent-glow)', color: popupMessage.type === 'error' ? '#ff6b6b' : 'var(--accent-color)', border: `1px solid ${popupMessage.type === 'error' ? '#ff6b6b' : 'var(--accent-color)'}` }}
                            onClick={() => { if (popupMessage.onAction) popupMessage.onAction(); else setPopupMessage(null); }}
                        >
                            {popupMessage.onAction ? 'Reload Dashboard' : 'Dismiss'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
});
