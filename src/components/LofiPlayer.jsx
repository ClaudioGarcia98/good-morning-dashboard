import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

const STATIONS = [
    { id: 'lTRiuFIWV54', name: 'Lofi Girl' },
    { id: '4xDzrJKXOOY', name: 'Synthwave Radio' },
    { id: '5yx6BWlEVcY', name: 'Chillhop Music' },
    { id: 'Dx5qFachd3A', name: 'Jazzhop Cafe' },
    { id: 'F1B9Fk_SgI0', name: 'Ambient Rain' },
    { id: 'Gu-g8FRG4Zs', name: 'Anime Lofi' } // Default original
];

export default React.memo(function () {
    const { volume, lofiId, setLofiId, customLofiId } = useSettings();
    const [isPlaying, setIsPlaying] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const [title, setTitle] = useState('Loading...');
    const iframeRef = useRef(null);

    const stationsList = [
        { id: customLofiId, name: 'My Saved Station' },
        ...STATIONS.filter(s => s.id !== customLofiId)
    ];

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync volume whenever it changes (YouTube expects 0-100)
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [Math.round(volume * 100)]
            }), '*');
        }
    }, [volume]);

    // Handle Play/Pause
    const togglePlay = () => {
        if (!iframeRef.current || !iframeRef.current.contentWindow) return;
        
        const func = isPlaying ? 'pauseVideo' : 'playVideo';
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: func,
            args: []
        }), '*');

        // Force volume sync when playing
        if (!isPlaying) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [Math.round(volume * 100)]
            }), '*');
        }
        
        setIsPlaying(!isPlaying);
    };

    // Update title when lofiId changes
    useEffect(() => {
        // Fast-path for known stations
        const knownStation = stationsList.find(s => s.id === lofiId);
        if (knownStation && knownStation.name !== 'My Saved Station') {
            setTitle(knownStation.name);
            return;
        }

        setTitle('Loading...');
        
        let isMounted = true;
        let isResolved = false;

        // Fallback to "Lofi Music" after 15 seconds if still loading
        const timeoutId = setTimeout(() => {
            if (isMounted && !isResolved) {
                setTitle('Lofi Music');
            }
        }, 15000);

        // Fetch title via noembed (CORS supported natively, much more reliable)
        // Note: this will fail for live_stream?channel= URLs, but we catch those above now!
        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${lofiId}`)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                isResolved = true;
                if (data && data.title) {
                    setTitle(data.title);
                } else {
                    setTitle('Lofi Music');
                }
            })
            .catch(() => {
                if (!isMounted) return;
                isResolved = true;
                setTitle('Lofi Music');
            });

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [lofiId]);

    const handleIframeLoad = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [Math.round(volume * 100)]
            }), '*');
        }
    };

    return (
        <div className="lofi-player">
            {/* Hidden iframe that actually plays the music */}
            <iframe 
                ref={iframeRef}
                width="0" 
                height="0" 
                src={`https://www.youtube.com/embed/${lofiId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&controls=0&showinfo=0&rel=0&origin=${window.location.origin}`}
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                title="Lofi Background Stream"
                onLoad={handleIframeLoad}
            />
            
            {/* Minimal UI Pill */}
            <div className="lofi-ui-container" ref={menuRef} style={{ position: 'relative' }}>
                {/* Station Menu Popover */}
                {showMenu && (
                    <div className="lofi-station-menu">
                        <div className="lofi-station-header">Stations</div>
                        <div className="lofi-station-list">
                            {stationsList.map(station => (
                                <button 
                                    key={station.id}
                                    className={`lofi-station-btn ${lofiId === station.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setLofiId(station.id);
                                        setShowMenu(false);
                                    }}
                                >
                                    <div className="lofi-station-icon">
                                        {lofiId === station.id ? (
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                            </svg>
                                        )}
                                    </div>
                                    {station.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="lofi-ui">
                    <button className="lofi-play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        )}
                    </button>
                    
                    <div className="lofi-info" onClick={() => setShowMenu(!showMenu)} style={{ width: '180px', flexShrink: 0, cursor: 'pointer' }} title="Click to change station">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="lofi-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%' }} title={title}>{title}</span>
                    </div>
                    <span className="lofi-status">
                        {isPlaying ? (
                            <div className="lofi-visualizer">
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'inline-block', marginTop: '4px' }}>Paused</span>
                        )}
                    </span>
                </div>
            </div>
            </div>
        </div>
    );
});
