import React from 'react';

function YouTubeMusic() {
    return (
        <div style={{
            marginTop: '30px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '16px',
            padding: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            maxWidth: '350px',
            margin: '30px auto 0 auto',
            transition: 'transform 0.3s ease, opacity 0.5s ease',
        }} className="opacity-transition yt-music-box">
            <iframe 
                width="100%" 
                height="80" 
                src="https://www.youtube.com/embed/jfKfPfyJRdk?controls=1&modestbranding=1&showinfo=0" 
                title="YouTube Music" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ borderRadius: '8px' }}
            ></iframe>
        </div>
    );
}

export default YouTubeMusic;
