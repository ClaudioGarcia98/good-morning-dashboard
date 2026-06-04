import { memo } from 'react';

export default memo(function TrailerPreview({ youtubeId, pos, muted, onMute, onUnmute, onMouseEnter, onMouseLeave, iframeRef }) {
    return (
        <div
            className="trailer-portal-container"
            style={{
                position: 'fixed',
                left: Math.max(20, pos.x),
                top: Math.max(20, Math.min(pos.y, window.innerHeight - 190)),
                width: '300px',
                height: '169px',
                background: '#000',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 99999,
                overflow: 'hidden',
                pointerEvents: 'auto',
                animation: 'fadeSlideIn 0.3s ease both',
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div style={{ borderRadius: '12px', overflow: 'hidden', width: '300px', height: '169px', position: 'relative' }}>
                <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&enablejsapi=1&modestbranding=1&showinfo=0&rel=0&controls=0&playsinline=1&origin=${window.location.origin}`}
                    width="300"
                    height="169"
                    style={{ border: 'none', display: 'block' }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                />
                <button
                    onClick={muted ? onUnmute : onMute}
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s ease',
                        zIndex: 2,
                    }}
                    title={muted ? 'Unmute' : 'Mute'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                        {muted ? (
                            <>
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </>
                        ) : (
                            <>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </>
                        )}
                    </svg>
                </button>
            </div>
        </div>
    );
});
