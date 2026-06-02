import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function SettingsPanel() {
    const {
        theme, setTheme, THEMES,
        font, setFont, FONTS,
        clockMode, setClockMode,
        username, setUsername,
        setBackgroundUrl,
        gifName, setGifName,
        speedDials, setSpeedDials,
        musicUrl, setMusicUrl
    } = useSettings();

    const [isOpen, setIsOpen] = useState(false);
    const [newDialName, setNewDialName] = useState('');
    const [newDialUrl, setNewDialUrl] = useState('');
    const panelRef = useRef(null);
    const toggleRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) &&
                toggleRef.current && !toggleRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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
        localStorage.setItem('dash_gif_name', f.name);
        setGifName(f.name);
    };

    const handleAddDial = () => {
        if (!newDialName.trim() || !newDialUrl.trim()) return;
        let finalUrl = newDialUrl.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        setSpeedDials([...speedDials, { id: Date.now(), name: newDialName.trim(), url: finalUrl }]);
        setNewDialName('');
        setNewDialUrl('');
    };

    const handleRemoveDial = (id) => {
        setSpeedDials(speedDials.filter(d => d.id !== id));
    };

    return (
        <>
            <div 
                className="settings-toggle" 
                id="settingsToggle" 
                title="Settings"
                ref={toggleRef}
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex="0"
                aria-label="Toggle Settings Panel"
                aria-expanded={isOpen}
                onKeyDown={e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94zM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
            </div>
            <div className={`settings-panel ${isOpen ? 'open' : ''}`} id="settingsPanel" ref={panelRef}>
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
                    <div className="sp-label">Music</div>
                    <div className="sp-group">
                        <label htmlFor="musicUrlInput">YouTube URL</label>
                        <input 
                            type="text" 
                            id="musicUrlInput" 
                            placeholder="Paste YouTube video or playlist URL" 
                            value={musicUrl}
                            onChange={(e) => setMusicUrl(e.target.value)}
                        />
                        <div style={{ fontSize: '0.65rem', opacity: 0.35, marginTop: '4px', lineHeight: 1.4 }}>
                            Supports video, playlist, or YouTube Music links
                        </div>
                    </div>
                </div>

                <div className="sp-section">
                    <div className="sp-label">Background</div>
                    <div className="gif-btn" onClick={() => fileInputRef.current?.click()}>
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
                    <div className="sp-label">Speed Dials</div>
                    <div className="sp-group">
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input 
                                type="text" 
                                placeholder="Name" 
                                value={newDialName}
                                onChange={e => setNewDialName(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <input 
                                type="text" 
                                placeholder="URL" 
                                value={newDialUrl}
                                onChange={e => setNewDialUrl(e.target.value)}
                                style={{ flex: 2 }}
                                onKeyDown={e => e.key === 'Enter' && handleAddDial()}
                            />
                            <button className="pill" onClick={handleAddDial}>Add</button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {speedDials.map(dial => (
                                <li key={dial.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
                                        <img src={`https://www.google.com/s2/favicons?domain=${new URL(dial.url).hostname}&sz=16`} style={{ width: 16, height: 16, borderRadius: 3 }} onError={e => e.target.style.display='none'} alt="" />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{dial.name}</span>
                                    </div>
                                    <button onClick={() => handleRemoveDial(dial.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
                                </li>
                            ))}
                        </ul>
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
            </div>
        </>
    );
}
