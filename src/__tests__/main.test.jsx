import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}));

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: mockCreateRoot,
  },
}));

vi.mock('../App.jsx', () => ({
  default: () => null,
}));

vi.mock('../index.css', () => ({}));

describe('main.jsx entry point bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('locates standard #root element and runs render flow', async () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);

    await import('../main.jsx');

    expect(mockCreateRoot).toHaveBeenCalledWith(rootDiv);
    expect(mockRender).toHaveBeenCalled();
  });
});
