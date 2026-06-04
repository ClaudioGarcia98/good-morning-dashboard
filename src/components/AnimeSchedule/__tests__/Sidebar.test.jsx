import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar.jsx';

vi.mock('../AnimeCard.jsx', () => ({
    default: ({ anime, isExpanded, isWatching }) => (
        <div
            data-testid="anime-card"
            data-id={anime.mal_id}
            data-expanded={isExpanded}
            data-watching={isWatching}
        >
            {anime.title}
        </div>
    ),
}));

const makeAnime = (id, title) => ({ mal_id: id, title });

const defaultProps = {
    isSidebarOpen: false,
    setIsSidebarOpen: vi.fn(),
    activeDay: 'monday',
    setActiveDay: vi.fn(),
    sidebarData: [],
    sidebarLoading: false,
    sidebarError: false,
    expandedAnime: null,
    setExpandedAnime: vi.fn(),
    userWatchingIds: [],
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    sidebarRef: { current: null },
    toggleRef: { current: null },
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe('Sidebar — toggle button', () => {
    it('renders the toggle button', () => {
        render(<Sidebar {...defaultProps} />);
        expect(document.getElementById('animeToggle')).toBeTruthy();
    });

    it('toggle has no "open" class when closed', () => {
        render(<Sidebar {...defaultProps} isSidebarOpen={false} />);
        expect(document.getElementById('animeToggle').classList.contains('open')).toBe(false);
    });

    it('toggle has "open" class when sidebar is open', () => {
        render(<Sidebar {...defaultProps} isSidebarOpen={true} />);
        expect(document.getElementById('animeToggle').classList.contains('open')).toBe(true);
    });

    it('calls setIsSidebarOpen(!current) when toggle is clicked (closed→open)', () => {
        const setIsSidebarOpen = vi.fn();
        render(<Sidebar {...defaultProps} isSidebarOpen={false} setIsSidebarOpen={setIsSidebarOpen} />);
        fireEvent.click(document.getElementById('animeToggle'));
        expect(setIsSidebarOpen).toHaveBeenCalledWith(true);
    });

    it('calls setIsSidebarOpen(false) when toggle is clicked (open→closed)', () => {
        const setIsSidebarOpen = vi.fn();
        render(<Sidebar {...defaultProps} isSidebarOpen={true} setIsSidebarOpen={setIsSidebarOpen} />);
        fireEvent.click(document.getElementById('animeToggle'));
        expect(setIsSidebarOpen).toHaveBeenCalledWith(false);
    });
});

describe('Sidebar — aside visibility', () => {
    it('aside has no "open" class when closed', () => {
        render(<Sidebar {...defaultProps} isSidebarOpen={false} />);
        expect(document.getElementById('animeSidebar').classList.contains('open')).toBe(false);
    });

    it('aside has "open" class when expanded', () => {
        render(<Sidebar {...defaultProps} isSidebarOpen={true} />);
        expect(document.getElementById('animeSidebar').classList.contains('open')).toBe(true);
    });

    it('close button calls setIsSidebarOpen(false)', () => {
        const setIsSidebarOpen = vi.fn();
        render(<Sidebar {...defaultProps} isSidebarOpen={true} setIsSidebarOpen={setIsSidebarOpen} />);
        fireEvent.click(screen.getByRole('button', { name: /close sidebar/i }));
        expect(setIsSidebarOpen).toHaveBeenCalledWith(false);
    });
});

describe('Sidebar — day filters', () => {
    it('renders all 7 day filters', () => {
        render(<Sidebar {...defaultProps} />);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(d => expect(screen.getByText(d)).toBeTruthy());
    });

    it('active day gets "active" class', () => {
        render(<Sidebar {...defaultProps} activeDay="wednesday" />);
        const btn = screen.getByText('Wed');
        expect(btn.classList.contains('active')).toBe(true);
    });

    it('inactive days do not get "active" class', () => {
        render(<Sidebar {...defaultProps} activeDay="wednesday" />);
        expect(screen.getByText('Mon').classList.contains('active')).toBe(false);
    });

    it('clicking a day calls setActiveDay', () => {
        const setActiveDay = vi.fn();
        render(<Sidebar {...defaultProps} setActiveDay={setActiveDay} />);
        fireEvent.click(screen.getByText('Fri'));
        expect(setActiveDay).toHaveBeenCalledWith('friday');
    });

    it('Enter key on a day calls setActiveDay', () => {
        const setActiveDay = vi.fn();
        render(<Sidebar {...defaultProps} setActiveDay={setActiveDay} />);
        fireEvent.keyDown(screen.getByText('Sat'), { key: 'Enter' });
        expect(setActiveDay).toHaveBeenCalledWith('saturday');
    });

    it('Space key on a day calls setActiveDay', () => {
        const setActiveDay = vi.fn();
        render(<Sidebar {...defaultProps} setActiveDay={setActiveDay} />);
        fireEvent.keyDown(screen.getByText('Sun'), { key: ' ' });
        expect(setActiveDay).toHaveBeenCalledWith('sunday');
    });

    it('other key on a day does not call setActiveDay', () => {
        const setActiveDay = vi.fn();
        render(<Sidebar {...defaultProps} setActiveDay={setActiveDay} />);
        fireEvent.keyDown(screen.getByText('Mon'), { key: 'Tab' });
        expect(setActiveDay).not.toHaveBeenCalled();
    });
});

describe('Sidebar — content states', () => {
    it('shows loading skeletons when sidebarLoading=true', () => {
        const { container } = render(<Sidebar {...defaultProps} sidebarLoading={true} />);
        expect(container.querySelectorAll('.skeleton-card')).toHaveLength(5);
    });

    it('shows error message when sidebarError=true', () => {
        render(<Sidebar {...defaultProps} sidebarError={true} />);
        expect(screen.getByText(/couldn't connect/i)).toBeTruthy();
    });

    it('error takes precedence over loading', () => {
        const { container } = render(<Sidebar {...defaultProps} sidebarError={true} sidebarLoading={true} />);
        expect(screen.getByText(/couldn't connect/i)).toBeTruthy();
        expect(container.querySelectorAll('.skeleton-card')).toHaveLength(0);
    });

    it('shows empty message when data is empty', () => {
        render(<Sidebar {...defaultProps} sidebarData={[]} />);
        expect(screen.getByText(/no anime scheduled/i)).toBeTruthy();
    });

    it('renders AnimeCard for each item in sidebarData', () => {
        const data = [makeAnime(1, 'One Piece'), makeAnime(2, 'Naruto'), makeAnime(3, 'Bleach')];
        render(<Sidebar {...defaultProps} sidebarData={data} />);
        const cards = screen.getAllByTestId('anime-card');
        expect(cards).toHaveLength(3);
    });

    it('passes isWatching=true when mal_id is in userWatchingIds', () => {
        const data = [makeAnime(42, 'Some Anime')];
        render(<Sidebar {...defaultProps} sidebarData={data} userWatchingIds={[42]} />);
        expect(screen.getByTestId('anime-card').dataset.watching).toBe('true');
    });

    it('passes isWatching=false when mal_id is not in userWatchingIds', () => {
        const data = [makeAnime(99, 'Other Anime')];
        render(<Sidebar {...defaultProps} sidebarData={data} userWatchingIds={[1, 2]} />);
        expect(screen.getByTestId('anime-card').dataset.watching).toBe('false');
    });

    it('passes isExpanded=true when expandedAnime matches id and source=sidebar', () => {
        const data = [makeAnime(7, 'Dragon Ball')];
        render(<Sidebar {...defaultProps} sidebarData={data} expandedAnime={{ id: 7, source: 'sidebar' }} />);
        expect(screen.getByTestId('anime-card').dataset.expanded).toBe('true');
    });

    it('passes isExpanded=false when expandedAnime source differs', () => {
        const data = [makeAnime(7, 'Dragon Ball')];
        render(<Sidebar {...defaultProps} sidebarData={data} expandedAnime={{ id: 7, source: 'today' }} />);
        expect(screen.getByTestId('anime-card').dataset.expanded).toBe('false');
    });

    it('passes isExpanded=false when expandedAnime id differs', () => {
        const data = [makeAnime(7, 'Dragon Ball')];
        render(<Sidebar {...defaultProps} sidebarData={data} expandedAnime={{ id: 99, source: 'sidebar' }} />);
        expect(screen.getByTestId('anime-card').dataset.expanded).toBe('false');
    });

    it('passes isExpanded=false when expandedAnime is null', () => {
        const data = [makeAnime(7, 'Dragon Ball')];
        render(<Sidebar {...defaultProps} sidebarData={data} expandedAnime={null} />);
        expect(screen.getByTestId('anime-card').dataset.expanded).toBe('false');
    });
});

describe('Sidebar — static content', () => {
    it('renders the heading', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText('Anime Schedule')).toBeTruthy();
    });

    it('renders the subtitle', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText('Daily Airing Episodes')).toBeTruthy();
    });

    it('renders JST tooltip text', () => {
        render(<Sidebar {...defaultProps} />);
        expect(screen.getByText(/Japan Standard Time/)).toBeTruthy();
    });
});
