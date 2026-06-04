import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import TrailerPreview from '../TrailerPreview.jsx';

vi.mock('../TrailerPreview.jsx', async (importOriginal) => importOriginal());

const defaultProps = {
    youtubeId: 'dQw4w9WgXcQ',
    pos: { x: 100, y: 200 },
    muted: false,
    onMute: vi.fn(),
    onUnmute: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    iframeRef: { current: null },
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe('TrailerPreview — rendering structure', () => {
    it('renders the portal container div', () => {
        const { container } = render(<TrailerPreview {...defaultProps} />);
        expect(container.querySelector('.trailer-portal-container')).toBeTruthy();
    });

    it('renders an iframe', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(screen.getByTitle(/unmute|mute/i)).toBeTruthy();
        expect(document.querySelector('iframe')).toBeTruthy();
    });

    it('renders the mute/unmute button', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(screen.getByRole('button')).toBeTruthy();
    });
});

describe('TrailerPreview — positioning', () => {
    it('applies pos.x as left style', () => {
        const { container } = render(<TrailerPreview {...defaultProps} pos={{ x: 150, y: 300 }} />);
        expect(container.firstChild.style.left).toBe('150px');
    });

    it('applies pos.y as top style', () => {
        const { container } = render(<TrailerPreview {...defaultProps} pos={{ x: 150, y: 300 }} />);
        expect(container.firstChild.style.top).toBe('300px');
    });

    it('clamps x to 20 when pos.x < 20', () => {
        const { container } = render(<TrailerPreview {...defaultProps} pos={{ x: 5, y: 200 }} />);
        expect(container.firstChild.style.left).toBe('20px');
    });

    it('does not clamp x when pos.x >= 20', () => {
        const { container } = render(<TrailerPreview {...defaultProps} pos={{ x: 20, y: 200 }} />);
        expect(container.firstChild.style.left).toBe('20px');
    });

    it('clamps y to 20 when pos.y < 20', () => {
        const { container } = render(<TrailerPreview {...defaultProps} pos={{ x: 100, y: -5 }} />);
        expect(container.firstChild.style.top).toBe('20px');
    });

    it('clamps y to window.innerHeight - 190 when pos.y exceeds it', () => {
        const { container } = render(
            <TrailerPreview {...defaultProps} pos={{ x: 100, y: window.innerHeight + 100 }} />
        );
        const expectedTop = `${window.innerHeight - 190}px`;
        expect(container.firstChild.style.top).toBe(expectedTop);
    });

    it('uses position: fixed on the container', () => {
        const { container } = render(<TrailerPreview {...defaultProps} />);
        expect(container.firstChild.style.position).toBe('fixed');
    });

    it('sets zIndex to 99999', () => {
        const { container } = render(<TrailerPreview {...defaultProps} />);
        expect(container.firstChild.style.zIndex).toBe('99999');
    });
});

describe('TrailerPreview — iframe autoplay and src', () => {
    it('embeds the youtubeId in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} youtubeId="abc123" />);
        expect(document.querySelector('iframe').src).toContain('abc123');
    });

    it('includes autoplay=1 in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('autoplay=1');
    });

    it('includes mute=1 in the iframe src for initial muted state', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('mute=1');
    });

    it('includes enablejsapi=1 in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('enablejsapi=1');
    });

    it('includes rel=0 in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('rel=0');
    });

    it('includes controls=0 in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('controls=0');
    });

    it('includes playsinline=1 in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('playsinline=1');
    });

    it('includes origin in the iframe src', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').src).toContain('origin=');
    });

    it('sets the allow attribute to include autoplay', () => {
        render(<TrailerPreview {...defaultProps} />);
        expect(document.querySelector('iframe').getAttribute('allow')).toContain('autoplay');
    });

    it('sets width and height on the iframe', () => {
        render(<TrailerPreview {...defaultProps} />);
        const iframe = document.querySelector('iframe');
        expect(iframe.getAttribute('width')).toBe('300');
        expect(iframe.getAttribute('height')).toBe('169');
    });
});

describe('TrailerPreview — iframeRef assignment', () => {
    it('attaches iframeRef.current to the iframe element after render', () => {
        const iframeRef = createRef();
        render(<TrailerPreview {...defaultProps} iframeRef={iframeRef} />);
        expect(iframeRef.current).toBe(document.querySelector('iframe'));
    });
});

describe('TrailerPreview — mute button (volume synchronization)', () => {
    it('shows title "Mute" when muted=false', () => {
        render(<TrailerPreview {...defaultProps} muted={false} />);
        expect(screen.getByRole('button').title).toBe('Mute');
    });

    it('shows title "Unmute" when muted=true', () => {
        render(<TrailerPreview {...defaultProps} muted={true} />);
        expect(screen.getByRole('button').title).toBe('Unmute');
    });

    it('renders sound-wave paths when muted=false', () => {
        const { container } = render(<TrailerPreview {...defaultProps} muted={false} />);
        expect(container.querySelectorAll('button path')).toHaveLength(2);
    });

    it('renders X lines when muted=true', () => {
        const { container } = render(<TrailerPreview {...defaultProps} muted={true} />);
        expect(container.querySelectorAll('button line')).toHaveLength(2);
    });

    it('does not render X lines when muted=false', () => {
        const { container } = render(<TrailerPreview {...defaultProps} muted={false} />);
        expect(container.querySelectorAll('button line')).toHaveLength(0);
    });

    it('does not render sound-wave paths when muted=true', () => {
        const { container } = render(<TrailerPreview {...defaultProps} muted={true} />);
        expect(container.querySelectorAll('button path')).toHaveLength(0);
    });

    it('calls onMute when button is clicked and muted=false', () => {
        const onMute = vi.fn();
        render(<TrailerPreview {...defaultProps} muted={false} onMute={onMute} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onMute).toHaveBeenCalledOnce();
    });

    it('does not call onUnmute when button is clicked and muted=false', () => {
        const onUnmute = vi.fn();
        render(<TrailerPreview {...defaultProps} muted={false} onUnmute={onUnmute} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onUnmute).not.toHaveBeenCalled();
    });

    it('calls onUnmute when button is clicked and muted=true', () => {
        const onUnmute = vi.fn();
        render(<TrailerPreview {...defaultProps} muted={true} onUnmute={onUnmute} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onUnmute).toHaveBeenCalledOnce();
    });

    it('does not call onMute when button is clicked and muted=true', () => {
        const onMute = vi.fn();
        render(<TrailerPreview {...defaultProps} muted={true} onMute={onMute} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onMute).not.toHaveBeenCalled();
    });
});

describe('TrailerPreview — mouse events', () => {
    it('calls onMouseEnter when hovering the container', () => {
        const onMouseEnter = vi.fn();
        const { container } = render(<TrailerPreview {...defaultProps} onMouseEnter={onMouseEnter} />);
        fireEvent.mouseEnter(container.firstChild);
        expect(onMouseEnter).toHaveBeenCalledOnce();
    });

    it('calls onMouseLeave when leaving the container', () => {
        const onMouseLeave = vi.fn();
        const { container } = render(<TrailerPreview {...defaultProps} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseLeave(container.firstChild);
        expect(onMouseLeave).toHaveBeenCalledOnce();
    });

    it('does not call onMouseLeave on mouseEnter', () => {
        const onMouseLeave = vi.fn();
        const { container } = render(<TrailerPreview {...defaultProps} onMouseLeave={onMouseLeave} />);
        fireEvent.mouseEnter(container.firstChild);
        expect(onMouseLeave).not.toHaveBeenCalled();
    });

    it('does not call onMouseEnter on mouseLeave', () => {
        const onMouseEnter = vi.fn();
        const { container } = render(<TrailerPreview {...defaultProps} onMouseEnter={onMouseEnter} />);
        fireEvent.mouseLeave(container.firstChild);
        expect(onMouseEnter).not.toHaveBeenCalled();
    });
});

describe('TrailerPreview — different youtubeId values', () => {
    it('builds the correct embed URL for a given youtubeId', () => {
        render(<TrailerPreview {...defaultProps} youtubeId="XYZ789" />);
        expect(document.querySelector('iframe').src).toContain('/embed/XYZ789');
    });

    it('updates iframe src when youtubeId changes', () => {
        const { rerender } = render(<TrailerPreview {...defaultProps} youtubeId="first" />);
        expect(document.querySelector('iframe').src).toContain('first');
        rerender(<TrailerPreview {...defaultProps} youtubeId="second" />);
        expect(document.querySelector('iframe').src).toContain('second');
    });
});
