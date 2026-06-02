import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { useSettings } from '../context/SettingsContext';

function YouTubeMusic() {
    const { volume, setVolume, hasInteracted } = useSettings();
    const [isPlaying, setIsPlaying] = useState(false);

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
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
            alignItems: 'center',
            gap: '15px'
        }} className="opacity-transition yt-music-box">
            
            <div style={{ display: 'none' }}>
                <ReactPlayer 
                    url="https://www.youtube.com/watch?v=5qap5aO4i9A" 
                    playing={isPlaying} 
                    controls={false}
                    volume={volume}
                    width="0" 
                    height="0" 
                />
            </div>

            <button 
                onClick={togglePlay}
                style={{
                    background: 'var(--theme-color, #00ffcc)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#000',
                    flexShrink: 0,
                    boxShadow: '0 4px 15px rgba(0, 255, 204, 0.4)'
                }}
            >
                {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={handleVolumeChange}
                    style={{ flex: 1, height: '4px', accentColor: 'var(--theme-color, #00ffcc)', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
}

export default YouTubeMusic;
