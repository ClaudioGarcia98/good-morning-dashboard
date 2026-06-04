import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AnimeSchedule from './index';

vi.mock('../../context/useSettings', () => ({
  useSettings: () => ({ showTop5Anime: true, showAnimeSidebar: true, volume: 0.5 })
}));

vi.mock('../../hooks/useAnimeSchedule', () => ({
  useAnimeSchedule: () => ({
    displayList: [{ mal_id: 1, title: 'Test Anime', score: 9.0 }],
    todayLoading: false,
    todayError: false,
    userWatchingIds: [],
    activeDay: 'monday',
    setActiveDay: vi.fn(),
    sidebarData: [],
    sidebarLoading: false,
    sidebarError: false,
    expandedAnime: null,
    setExpandedAnime: vi.fn(),
    previewTrailer: null,
    previewPos: { x: 0, y: 0 },
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handleTrailerMouseEnter: vi.fn(),
    handleTrailerMouseLeave: vi.fn(),
    trailerMuted: true,
    handleUnmute: vi.fn(),
    handleMute: vi.fn(),
    trailerIframeRef: { current: null },
    isSidebarOpen: false,
    setIsSidebarOpen: vi.fn(),
    toggleRef: { current: null },
    sidebarRef: { current: null },
    todayFilter: 'monday'
  })
}));

describe('AnimeSchedule Main', () => {
  it('renders today anime box', () => {
    render(<AnimeSchedule />);
    expect(screen.getByText("Today's Launch")).toBeTruthy();
    expect(screen.getByText("Test Anime")).toBeTruthy();
  });
});
