import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useSettings } from '../context/SettingsContext';

function YouTubeMusic() {
    const { volume, setVolume, hasInteracted, musicUrl } = useSettings();
    const [isPlaying, setIsPlaying] = useState(false);
    const [songTitle, setSongTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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

        const fetchTitle = async () => {
            try {
                const res = await fetch(
                    `https://noembed.com/embed?url=${encodeURIComponent(currentUrl)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.title) setSongTitle(data.title);
                }
            } catch (e) {
                // Silently fail, title is just a nice-to-have
            }
        };
        fetchTitle();
    }, [currentUrl]);

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const togglePlay = () => {
        if (!hasInteracted) return;
        setIsPlaying(prev => !prev);
    };

    const handleReady = useCallback(() => {
        setIsLoading(false);
        setHasError(false);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoading(false);
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
        const fraction = (e.clientX - rect.left) / rect.width;
        if (playerRef.current) {
            playerRef.current.seekTo(fraction, 'fraction');
        }
    };

    return (
        <div style={{
            marginTop: '30px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '24px',
            padding: '12px 20px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            width: '280px',
            margin: '30px auto 0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }} className="opacity-transition yt-music-box">

            {/* Hidden player - use position absolute + overflow hidden instead of display:none */}
            <div style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                opacity: 0,
                pointerEvents: 'none',
                left: '-9999px'
            }}>
                <ReactPlayer
                    ref={playerRef}
                    url={currentUrl}
                    playing={isPlaying}
                    controls={false}
                    volume={volume}
                    muted={!hasInteracted}
                    width="200px"
                    height="200px"
                    onReady={handleReady}
                    onError={handleError}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onEnded={handleEnded}
                    onBuffer={() => setIsLoading(true)}
                    onBufferEnd={() => setIsLoading(false)}
                    config={{
                        youtube: {
                            playerVars: {
                                modestbranding: 1,
                                rel: 0,
                                showinfo: 0,
                                origin: window.location.origin
                            }
                        }
                    }}
                />
            </div>

            {/* Controls row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={togglePlay}
                    disabled={hasError}
                    title={hasError ? 'Unable to play this URL' : (isPlaying ? 'Pause' : 'Play')}
                    style={{
                        background: hasError ? 'rgba(255,100,100,0.6)' : 'var(--theme-color, #00ffcc)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: hasError ? 'not-allowed' : 'pointer',
                        color: '#000',
                        flexShrink: 0,
                        boxShadow: hasError ? 'none' : '0 4px 15px rgba(0, 255, 204, 0.4)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isLoading ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                    ) : hasError ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    ) : isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    )}
                </button>

                {/* Song title + progress */}
                <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                    <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        opacity: songTitle ? 0.9 : 0.4,
                        marginBottom: '4px'
                    }}>
                        {hasError ? 'Unable to play' : (songTitle || 'YouTube Music')}
                    </div>

                    {/* Progress bar */}
                    <div
                        onClick={handleSeek}
                        style={{
                            width: '100%',
                            height: '3px',
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

                    {/* Time display */}
                    {duration > 0 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.58rem',
                            opacity: 0.4,
                            marginTop: '2px'
                        }}>
                            <span>{formatTime(progress * duration)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Volume row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    style={{ flex: 1, height: '3px', accentColor: 'var(--accent-color, #00ffcc)', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
}

export default YouTubeMusic;
