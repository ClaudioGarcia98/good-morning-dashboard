import React from 'react';
import ReactPlayer from 'react-player';
import { useSettings } from '../context/SettingsContext';

function YouTubeMusic() {
    const { volume, setVolume } = useSettings();

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    return (
        <div style={{
            marginTop: '30px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '16px',
            padding: '12px 15px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            maxWidth: '350px',
            margin: '30px auto 0 auto',
            transition: 'transform 0.3s ease, opacity 0.5s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }} className="opacity-transition yt-music-box">
            
            <div style={{ borderRadius: '8px', overflow: 'hidden', height: '80px', pointerEvents: 'none' }}>
                <ReactPlayer 
                    url="https://www.youtube.com/watch?v=5qap5aO4i9A" 
                    playing={true} 
                    controls={false}
                    volume={volume}
                    width="100%" 
                    height="120px" 
                    style={{ marginTop: '-20px' }}
                    config={{
                        youtube: {
                            playerVars: { modestbranding: 1, showinfo: 0, rel: 0 }
                        }
                    }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 5px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
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
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', width: '30px', textAlign: 'right' }}>
                    {Math.round(volume * 100)}%
                </span>
            </div>
        </div>
    );
}

export default YouTubeMusic;
