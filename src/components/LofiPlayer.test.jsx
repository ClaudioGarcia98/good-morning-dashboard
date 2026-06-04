import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LofiPlayer from './LofiPlayer';

vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ lofiId: 'testVideoId', volume: 0.5 })
}));

describe('LofiPlayer', () => {
  it('renders the iframe with correct video id', () => {
    const { container } = render(<LofiPlayer />);
    const iframe = container.querySelector('iframe');
    expect(iframe.src).toContain('testVideoId');
  });
});
