import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../../context/useSettings';
import { useAnimeSchedule } from '../../hooks/useAnimeSchedule';
import AnimeCard from './AnimeCard';
import Sidebar from './Sidebar';
import TrailerPreview from './TrailerPreview';

export default memo(function AnimeSchedule() {
    const { showTop5Anime, showAnimeSidebar } = useSettings();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    const {
        isSidebarOpen, setIsSidebarOpen,
        activeDay, setActiveDay,
        sidebarData, sidebarLoading, sidebarError,
        sidebarRef, toggleRef,
        todayLoading, todayError,
        displayList,
        userWatchingIds,
        expandedAnime, setExpandedAnime,
        previewTrailer, previewPos,
        trailerMuted,
        trailerIframeRef,
        handleMouseEnter, handleMouseLeave,
        handleTrailerMouseEnter, handleTrailerMouseLeave,
        handleUnmute, handleMute,
    } = useAnimeSchedule();

    const sidebarPortal = isMounted ? document.getElementById('mainUi') : null;
    const trailerPortal = isMounted ? document.body : null;

    return (
        <>
            {showTop5Anime && (
                <div className="today-anime-box" id="todayAnimeBox">
                    <div className="tab-header">
                        <span className="tab-title" style={{ display: 'flex', alignItems: 'center' }}>
                            Today's Launch
                            <div className="info-badge-container" tabIndex={0} aria-label="Sorting Info">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <div className="custom-hint-card">
                                    <div className="hint-card-text">
                                        <p>We automatically prioritize the shows you are currently watching on MyAnimeList, then fill the remaining spots with today's top-rated premieres.</p>
                                    </div>
                                </div>
                            </div>
                        </span>
                    </div>
                    <div className="tab-list" id="tabList">
                        {todayError ? (
                            <div className="error-state">Couldn't connect to MyAnimeList right now.</div>
                        ) : todayLoading ? (
                            <>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="skeleton-card">
                                        <div className="skeleton-img"></div>
                                        <div className="skeleton-lines">
                                            <div className="skeleton-line medium"></div>
                                            <div className="skeleton-line short"></div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : displayList.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>No anime airing today.</div>
                        ) : (
                            displayList.map(anime => (
                                <AnimeCard
                                    key={anime.mal_id}
                                    anime={anime}
                                    variant="today"
                                    isExpanded={expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'today'}
                                    isWatching={userWatchingIds.includes(anime.mal_id)}
                                    onToggleExpand={setExpandedAnime}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {showAnimeSidebar && sidebarPortal && createPortal(
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    activeDay={activeDay}
                    setActiveDay={setActiveDay}
                    sidebarData={sidebarData}
                    sidebarLoading={sidebarLoading}
                    sidebarError={sidebarError}
                    expandedAnime={expandedAnime}
                    setExpandedAnime={setExpandedAnime}
                    userWatchingIds={userWatchingIds}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    sidebarRef={sidebarRef}
                    toggleRef={toggleRef}
                />,
                sidebarPortal
            )}

            {trailerPortal && previewTrailer && createPortal(
                <TrailerPreview
                    youtubeId={previewTrailer}
                    pos={previewPos}
                    muted={trailerMuted}
                    onMute={handleMute}
                    onUnmute={handleUnmute}
                    onMouseEnter={handleTrailerMouseEnter}
                    onMouseLeave={handleTrailerMouseLeave}
                    iframeRef={trailerIframeRef}
                />,
                trailerPortal
            )}
        </>
    );
});
