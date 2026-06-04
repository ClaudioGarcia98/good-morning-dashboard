import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimeCard from '../AnimeCard.jsx';

vi.mock('../AnimeCard.jsx', async (importOriginal) => importOriginal());

const baseAnime = {
    mal_id: 1,
    title: 'Attack on Titan',
    score: 9.1,
    synopsis: 'Humans fight titans.',
    url: 'https://myanimelist.net/anime/1',
    images: {
        jpg: {
            image_url: 'https://cdn.example.com/large.jpg',
            large_image_url: 'https://cdn.example.com/large.jpg',
            small_image_url: 'https://cdn.example.com/small.jpg',
        },
    },
    broadcast: { time: '23:00', day: 'sunday' },
    genres: [
        { mal_id: 1, name: 'Action' },
        { mal_id: 2, name: 'Drama' },
        { mal_id: 3, name: 'Fantasy' },
        { mal_id: 4, name: 'Horror' },
    ],
};

const defaultProps = {
    anime: baseAnime,
    variant: 'sidebar',
    isExpanded: false,
    isWatching: false,
    onToggleExpand: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T10:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

describe('AnimeCard — sidebar variant rendering', () => {
    it('renders the anime title', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText('Attack on Titan')).toBeTruthy();
    });

    it('renders the score', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText(/9\.1/)).toBeTruthy();
    });

    it('renders the broadcast time', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText(/23:00/)).toBeTruthy();
    });

    it('renders the synopsis', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText('Humans fight titans.')).toBeTruthy();
    });

    it('renders the MAL link with correct href', () => {
        render(<AnimeCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /myanimelist/i });
        expect(link.getAttribute('href')).toBe('https://myanimelist.net/anime/1');
    });

    it('renders the MAL link with target _blank and rel noopener', () => {
        render(<AnimeCard {...defaultProps} />);
        const link = screen.getByRole('link', { name: /myanimelist/i });
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('renders the cover image with correct src and alt', () => {
        render(<AnimeCard {...defaultProps} />);
        const img = screen.getByAltText('Attack on Titan');
        expect(img.getAttribute('src')).toBe('https://cdn.example.com/large.jpg');
    });

    it('renders up to 3 genre tags, not 4', () => {
        render(<AnimeCard {...defaultProps} />);
        expect(screen.getByText('Action')).toBeTruthy();
        expect(screen.getByText('Drama')).toBeTruthy();
        expect(screen.getByText('Fantasy')).toBeTruthy();
        expect(screen.queryByText('Horror')).toBeNull();
    });

    it('falls back to "No synopsis available." when synopsis is absent', () => {
        const anime = { ...baseAnime, synopsis: undefined };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText('No synopsis available.')).toBeTruthy();
    });

    it('falls back to "?" for broadcast time when absent', () => {
        const anime = { ...baseAnime, broadcast: {} };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText(/\?/)).toBeTruthy();
    });

    it('does not show score separator when score is absent', () => {
        const anime = { ...baseAnime, score: null };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.queryByText(/⭐/)).toBeNull();
    });

    it('renders correct element id', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.querySelector('#sidebar-anime-1')).toBeTruthy();
    });

    it('applies watched-highlight class when isWatching=true', () => {
        const { container } = render(<AnimeCard {...defaultProps} isWatching={true} />);
        expect(container.firstChild.classList.contains('watched-highlight')).toBe(true);
    });

    it('does not apply watched-highlight when isWatching=false', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.firstChild.classList.contains('watched-highlight')).toBe(false);
    });

    it('applies expanded class when isExpanded=true', () => {
        const { container } = render(<AnimeCard {...defaultProps} isExpanded={true} />);
        expect(container.firstChild.classList.contains('expanded')).toBe(true);
    });

    it('does not apply expanded class when isExpanded=false', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.firstChild.classList.contains('expanded')).toBe(false);
    });

    it('has role=button and tabIndex=0', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        const card = container.firstChild;
        expect(card.getAttribute('role')).toBe('button');
        expect(card.getAttribute('tabindex')).toBe('0');
    });

    it('renders no genres gracefully when genres is empty', () => {
        const anime = { ...baseAnime, genres: [] };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelectorAll('.anime-tag')).toHaveLength(0);
    });

    it('renders no genres gracefully when genres is absent', () => {
        const anime = { ...baseAnime, genres: undefined };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelectorAll('.anime-tag')).toHaveLength(0);
    });
});

describe('AnimeCard — today variant rendering', () => {
    const todayProps = { ...defaultProps, variant: 'today' };

    it('renders the title', () => {
        render(<AnimeCard {...todayProps} />);
        expect(screen.getByText('Attack on Titan')).toBeTruthy();
    });

    it('renders score and broadcast time', () => {
        render(<AnimeCard {...todayProps} />);
        expect(screen.getByText(/9\.1/)).toBeTruthy();
        expect(screen.getByText(/23:00/)).toBeTruthy();
    });

    it('shows N/A when score is absent', () => {
        const anime = { ...baseAnime, score: null };
        render(<AnimeCard {...todayProps} anime={anime} />);
        expect(screen.getByText(/N\/A/)).toBeTruthy();
    });

    it('renders small image', () => {
        render(<AnimeCard {...todayProps} />);
        const img = screen.getByAltText('Attack on Titan');
        expect(img.getAttribute('src')).toBe('https://cdn.example.com/small.jpg');
    });

    it('renders correct element id with tab- prefix', () => {
        const { container } = render(<AnimeCard {...todayProps} />);
        expect(container.querySelector('#tab-anime-1')).toBeTruthy();
    });

    it('applies watched-highlight class', () => {
        const { container } = render(<AnimeCard {...todayProps} isWatching={true} />);
        expect(container.firstChild.classList.contains('watched-highlight')).toBe(true);
    });

    it('applies expanded class', () => {
        const { container } = render(<AnimeCard {...todayProps} isExpanded={true} />);
        expect(container.firstChild.classList.contains('expanded')).toBe(true);
    });
});

describe('AnimeCard — click and keyboard interactions', () => {
    it('calls onToggleExpand with expand payload on click when collapsed', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggleExpand).toHaveBeenCalledOnce();
        expect(onToggleExpand).toHaveBeenCalledWith({ id: 1, source: 'sidebar' });
    });

    it('calls onToggleExpand with null on click when already expanded', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={true} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggleExpand).toHaveBeenCalledWith(null);
    });

    it('calls onToggleExpand on Enter key', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
        expect(onToggleExpand).toHaveBeenCalledOnce();
    });

    it('calls onToggleExpand on Space key', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
        expect(onToggleExpand).toHaveBeenCalledOnce();
    });

    it('does not call onToggleExpand on other keys', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} onToggleExpand={onToggleExpand} />);
        fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
        expect(onToggleExpand).not.toHaveBeenCalled();
    });

    it('calls onMouseEnter with event and anime on hover', () => {
        const onMouseEnter = vi.fn();
        render(<AnimeCard {...defaultProps} onMouseEnter={onMouseEnter} />);
        fireEvent.mouseEnter(screen.getByRole('button'));
        expect(onMouseEnter).toHaveBeenCalledOnce();
        expect(onMouseEnter.mock.calls[0][1]).toBe(baseAnime);
    });

    it('calls onMouseLeave on mouse leave', () => {
        const onMouseLeave = vi.fn();
        render(<AnimeCard {...defaultProps} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseLeave(screen.getByRole('button'));
        expect(onMouseLeave).toHaveBeenCalledOnce();
    });

    it('today variant calls onToggleExpand with source=today', () => {
        const onToggleExpand = vi.fn();
        render(<AnimeCard {...defaultProps} variant="today" onToggleExpand={onToggleExpand} isExpanded={false} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onToggleExpand).toHaveBeenCalledWith({ id: 1, source: 'today' });
    });
});

describe('AnimeCard — image fallback chain (sidebar)', () => {
    it('uses large_image_url when image_url is absent', () => {
        const anime = {
            ...baseAnime,
            images: { jpg: { large_image_url: 'https://cdn.example.com/large.jpg', small_image_url: 'small.jpg' } },
        };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByAltText('Attack on Titan').getAttribute('src')).toBe('https://cdn.example.com/large.jpg');
    });

    it('uses small_image_url as last resort', () => {
        const anime = {
            ...baseAnime,
            images: { jpg: { small_image_url: 'https://cdn.example.com/small.jpg' } },
        };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByAltText('Attack on Titan').getAttribute('src')).toBe('https://cdn.example.com/small.jpg');
    });
});

describe('AnimeCard — CountdownBadge', () => {
    it('renders countdown badge when broadcast is valid', () => {
        const { container } = render(<AnimeCard {...defaultProps} />);
        expect(container.querySelector('.anime-countdown')).toBeTruthy();
    });

    it('does not render countdown when broadcast is absent', () => {
        const anime = { ...baseAnime, broadcast: null };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelector('.anime-countdown')).toBeNull();
    });

    it('does not render countdown when broadcast has no time', () => {
        const anime = { ...baseAnime, broadcast: { day: 'monday' } };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelector('.anime-countdown')).toBeNull();
    });

    it('does not render countdown when broadcast has no day', () => {
        const anime = { ...baseAnime, broadcast: { time: '12:00' } };
        const { container } = render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(container.querySelector('.anime-countdown')).toBeNull();
    });

    it('shows "Out Now!" when episode released within last 24 JST hours', () => {
        const now = new Date('2026-06-01T10:00:00Z');
        vi.setSystemTime(now);
        const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const day = dayNames[jstNow.getUTCDay()];
        const broadcastTime = new Date(jstNow.getTime() - 2 * 60 * 60 * 1000);
        const h = String(broadcastTime.getUTCHours()).padStart(2, '0');
        const m = String(broadcastTime.getUTCMinutes()).padStart(2, '0');
        const anime = { ...baseAnime, broadcast: { time: `${h}:${m}`, day } };
        render(<AnimeCard {...defaultProps} anime={anime} />);
        expect(screen.getByText('Out Now!')).toBeTruthy();
    });
});
