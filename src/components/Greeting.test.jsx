import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Greeting from './Greeting';

// Mock the useSettings hook
vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ username: 'Claudio' })
}));

describe('Greeting Component', () => {
  it('renders the username correctly', () => {
    render(<Greeting />);
    
    // Since the greeting depends on the time of day, we just check if the username is rendered
    expect(screen.getByText(/Claudio/i)).toBeTruthy();
  });
});
