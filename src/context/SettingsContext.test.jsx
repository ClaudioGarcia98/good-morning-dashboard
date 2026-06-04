import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsProvider } from './SettingsContext';
import { SettingsContext } from './Context';
import { useContext } from 'react';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn().mockReturnValue({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          put: vi.fn()
        })
      })
    }
  })
};
vi.stubGlobal('indexedDB', mockIndexedDB);

const TestComponent = () => {
  const settings = useContext(SettingsContext);
  return (
    <div>
      <span data-testid="username">{settings.username}</span>
      <button onClick={() => settings.setUsername('TestUser')}>Change Name</button>
    </div>
  );
};

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default settings', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    expect(screen.getByTestId('username').textContent).toBe('Cláudio');
  });

  it('updates settings and saves to localStorage', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    
    act(() => {
      screen.getByText('Change Name').click();
    });
    
    expect(screen.getByTestId('username').textContent).toBe('TestUser');
    expect(localStorage.getItem('dash_username')).toBe('TestUser');
  });
});
