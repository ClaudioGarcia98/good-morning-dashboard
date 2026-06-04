import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Quote from './Quote';

// Mock fetch globally
global.fetch = vi.fn();

describe('Quote Component', () => {
  it('renders a default quote initially', () => {
    const { container } = render(<Quote />);
    expect(container.querySelector('.quote-content')).toBeTruthy();
  });

  it('fetches a new quote on click', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quote: "Test Quote", character: "Test Author", anime: "Test Anime" })
    });
    
    render(<Quote />);
    const container = screen.getByTitle('Click for a new quote');
    
    await act(async () => {
      fireEvent.click(container);
    });
    
    // Wait for internal timeout (300ms) in Quote.jsx
    await act(async () => {
      await new Promise(r => setTimeout(r, 400));
    });
    
    expect(screen.getByText(/"Test Quote"/i)).toBeTruthy();
  });
});
