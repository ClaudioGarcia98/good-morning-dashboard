import { memo, useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';

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

export default memo(function MediaSettings() {
    const {
        volume, setVolume,
        gifName, setGifName,
        setBackgroundUrl, setBackgroundIsVideo,
        customLofiId, setCustomLofiId, setLofiId,
    } = useSettingsStore(useShallow(s => ({
        volume: s.volume, setVolume: s.setVolume,
        gifName: s.gifName, setGifName: s.setGifName,
        setBackgroundUrl: s.setBackgroundUrl, setBackgroundIsVideo: s.setBackgroundIsVideo,
        customLofiId: s.customLofiId, setCustomLofiId: s.setCustomLofiId, setLofiId: s.setLofiId,
    })));

    const [tempLofi, setTempLofi] = useState(customLofiId);
    const [prevCustomLofi, setPrevCustomLofi] = useState(customLofiId);
    const bgFileInputRef = useRef(null);

    // Sync tempLofi when customLofiId changes externally (e.g. station picker in LofiPlayer)
    if (customLofiId !== prevCustomLofi) {
        setPrevCustomLofi(customLofiId);
        setTempLofi(customLofiId);
    }

    const handleFileChange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        await saveBlob(f);
        setBackgroundUrl(URL.createObjectURL(f));
        setBackgroundIsVideo(f.type && f.type.startsWith('video/'));
        setGifName(f.name);
    };

    const handleSaveLofi = () => {
        let val = tempLofi.trim();
        const match = val.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match) val = match[1];
        setCustomLofiId(val);
        setLofiId(val);
    };

    return (
        <>
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
                    onClick={() => bgFileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bgFileInputRef.current?.click(); } }}
                    role="button"
                    tabIndex={0}
                >
                    <span>🎞</span><span>{gifName ? 'Change GIF…' : 'Choose local GIF…'}</span>
                </div>
                <div className="gif-name">{gifName || 'No background set'}</div>
                <input
                    type="file"
                    ref={bgFileInputRef}
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
        </>
    );
});
