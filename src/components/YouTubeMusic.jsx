import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useSettings } from '../context/SettingsContext';

function YouTubeMusic() {
    const { volume, setVolume, musicUrl } = useSettings();
    const [isPlaying, setIsPlaying] = useState(false);
    const [songTitle, setSongTitle] = useState('');
    const [hasError, setHasError] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const playerRef = useRef(null);

    const currentUrl = musicUrl || 'https://www.youtube.com/watch?v=5qap5aO4i9A';

    // Fetch song title via oembed
    useEffect(() => {
        if (!currentUrl) return;
        setSongTitle('');
        setHasError(false);
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);

        const fetchTitle = async () => {
            try {
                const res = await fetch(
                    `https://noembed.com/embed?url=${encodeURIComponent(currentUrl)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.title) setSongTitle(data.title);
                }
            } catch (e) { /* silent */ }
        };
        fetchTitle();
    }, [currentUrl]);

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
    };

    const handleReady = useCallback(() => {
        setHasError(false);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsPlaying(false);
    }, []);

    const handleProgress = useCallback((state) => {
        setProgress(state.played || 0);
    }, []);

    const handleDuration = useCallback((dur) => {
        setDuration(dur || 0);
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);
    }, []);

    const formatTime = (seconds) => {
        if (!seconds || !isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (playerRef.current) {
            playerRef.current.seekTo(fraction, 'fraction');
        }
    };

    return (
        <div className="opacity-transition yt-music-box" style={{
            marginTop: '30px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '24px',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            width: '280px',
            margin: '30px auto 0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>

            {/* YouTube player - visible so audio works */}
            <div style={{
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                aspectRatio: '16/9'
            }}>
                <ReactPlayer
                    ref={playerRef}
                    url={currentUrl}
                    playing={isPlaying}
                    controls={true}
                    volume={volume}
                    muted={false}
                    width="100%"
                    height="100%"
                    onReady={handleReady}
                    onError={handleError}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onEnded={handleEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    config={{
                        youtube: {
                            playerVars: {
                                modestbranding: 1,
                                rel: 0,
                                playsinline: 1
                            }
                        }
                    }}
                />
            </div>

            {/* Song title */}
            <div style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                opacity: songTitle ? 0.9 : 0.4,
                textAlign: 'center'
            }}>
                {hasError ? '⚠ Unable to play' : (songTitle || 'YouTube Music')}
            </div>

            {/* Custom progress bar */}
            <div
                onClick={handleSeek}
                style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                <div style={{
                    width: `${progress * 100}%`,
                    height: '100%',
                    background: 'var(--accent-color, #00ffcc)',
                    borderRadius: '2px',
                    transition: 'width 0.3s linear'
                }} />
            </div>

            {/* Time + Volume row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {duration > 0 && (
                    <span style={{ fontSize: '0.58rem', opacity: 0.4, flexShrink: 0 }}>
                        {formatTime(progress * duration)} / {formatTime(duration)}
                    </span>
                )}
                <div style={{ flex: 1 }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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
                    onChange={handleVolumeChange}
                    style={{ width: '80px', height: '3px', accentColor: 'var(--accent-color, #00ffcc)', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
}

export default YouTubeMusic;
