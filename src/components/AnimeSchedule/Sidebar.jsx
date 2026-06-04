import { memo } from 'react';
import AnimeCard from './AnimeCard';

const DAY_FILTERS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SkeletonList = () => (
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
);

export default memo(function Sidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    activeDay,
    setActiveDay,
    sidebarData,
    sidebarLoading,
    sidebarError,
    expandedAnime,
    setExpandedAnime,
    userWatchingIds,
    onMouseEnter,
    onMouseLeave,
    sidebarRef,
    toggleRef,
}) {
    return (
        <>
            <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                <button
                    className={`anime-toggle ${isSidebarOpen ? 'open' : ''}`}
                    id="animeToggle"
                    title="Anime Schedule"
                    ref={toggleRef}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M21.2 5.5l-1.4-1.4c-.4-.4-1-.4-1.4 0l-1.4 1.4-1.4-1.4c-.4-.4-1-.4-1.4 0L14.2 5.5l-1.4-1.4c-.4-.4-1-.4-1.4 0l-1.4 1.4-1.4-1.4c-.4-.4-1-.4-1.4 0L7.2 5.5 5.8 4.1c-.4-.4-1-.4-1.4 0L2.8 5.7c-.5.5-.8 1.1-.8 1.8v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-10c0-.7-.3-1.3-.8-1.8zM20 17.5H4v-8h16v8z"/>
                    </svg>
                </button>
            </div>

            <aside className={`anime-sidebar ${isSidebarOpen ? 'open' : ''}`} id="animeSidebar" ref={sidebarRef}>
                <header className="as-header">
                    <div className="as-header-titles">
                        <h2>Anime Schedule</h2>
                        <span className="as-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Daily Airing Episodes
                            <span className="info-badge-container" tabIndex={0} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <svg className="info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'help', transform: 'translateY(-2px)' }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <span className="info-tooltip sidebar-tooltip" style={{ whiteSpace: 'normal', width: '230px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 400, padding: '12px 14px' }}>
                                    Anime schedules are based on <strong>Japan Standard Time (JST)</strong>.
                                    <br/><br/>
                                    Depending on your timezone, the listed broadcast day might not match your local day.
                                </span>
                            </span>
                        </span>
                    </div>
                    <button className="as-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close Sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>

                <div className="as-days">
                    {DAY_FILTERS.map(df => {
                        const dayName = df.charAt(0).toUpperCase() + df.substring(1, 3);
                        return (
                            <div
                                key={df}
                                className={`as-day-btn ${activeDay === df ? 'active' : ''}`}
                                onClick={() => setActiveDay(df)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveDay(df); } }}
                                role="button"
                                tabIndex={0}
                            >
                                {dayName}
                            </div>
                        );
                    })}
                </div>

                <div className="as-content">
                    {sidebarError ? (
                        <div className="error-state">Couldn't connect to MyAnimeList right now.</div>
                    ) : sidebarLoading ? (
                        <SkeletonList />
                    ) : sidebarData.length === 0 ? (
                        <div style={{ opacity: 0.5, padding: '20px', textAlign: 'center', fontSize: '0.8rem' }}>No anime scheduled.</div>
                    ) : (
                        sidebarData.map(anime => (
                            <AnimeCard
                                key={anime.mal_id}
                                anime={anime}
                                variant="sidebar"
                                isExpanded={expandedAnime?.id === anime.mal_id && expandedAnime?.source === 'sidebar'}
                                isWatching={userWatchingIds.includes(anime.mal_id)}
                                onToggleExpand={setExpandedAnime}
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                            />
                        ))
                    )}
                </div>
            </aside>
        </>
    );
});
