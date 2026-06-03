import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function LofiPlayer() {
    const { volume, lofiId } = useSettings();
    const [isPlaying, setIsPlaying] = useState(false);
    const [title, setTitle] = useState('Loading...');
    const iframeRef = useRef(null);

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

    // Auto-play / update when lofiId changes
    useEffect(() => {
        setIsPlaying(false);
        setTitle('Loading...');
        
        let isMounted = true;
        let isResolved = false;

        // Fallback to "Lofi Music" after 15 seconds if still loading
        const timeoutId = setTimeout(() => {
            if (isMounted && !isResolved) {
                setTitle('Lofi Music');
            }
        }, 15000);

        // Fetch title via oEmbed & CORS proxy
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${lofiId}&format=json`;
        fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(oembedUrl)}`)
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                isResolved = true;
                try {
                    const parsed = JSON.parse(data.contents);
                    if (parsed && parsed.title) setTitle(parsed.title);
                    else setTitle('Lofi Music');
                } catch (e) {
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

    return (
        <div className="lofi-player">
            {/* Hidden iframe that actually plays the music */}
            <iframe 
                ref={iframeRef}
                width="0" 
                height="0" 
                src={`https://www.youtube.com/embed/${lofiId}?enablejsapi=1&autoplay=0&controls=0&showinfo=0&rel=0`}
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                title="Lofi Background Stream"
            />
            
            {/* Minimal UI Pill */}
            <div className="lofi-ui" onClick={togglePlay}>
                <button className="lofi-play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
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
                <div className="lofi-info" style={{ maxWidth: '200px' }}>
                    <span className="lofi-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>{title}</span>
                    <span className="lofi-status">
                        {isPlaying ? (
                            <span className="lofi-eq">
                                <span className="eq-bar"></span>
                                <span className="eq-bar"></span>
                                <span className="eq-bar"></span>
                            </span>
                        ) : 'Paused'}
                    </span>
                </div>
            </div>
        </div>
    );
}
