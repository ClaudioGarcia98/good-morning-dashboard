import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpeedDial from './SpeedDial';

vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ 
    speedDials: [
      { id: 1, name: 'Google', url: 'https://google.com' }
    ]
  })
}));

describe('SpeedDial', () => {
  it('renders configured speed dials', () => {
    render(<SpeedDial />);
    expect(screen.getByLabelText('Google')).toBeTruthy();
  });
});
