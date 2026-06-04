import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WeatherWidget from './WeatherWidget';

vi.mock('../context/useSettings', () => ({
  useSettings: () => ({ useCelsius: true, fallbackCity: 'London' })
}));

global.fetch = vi.fn();
const mockGeolocation = {
  getCurrentPosition: vi.fn().mockImplementation((success) => 
    success({ coords: { latitude: 51.5074, longitude: -0.1278 } })
  )
};
vi.stubGlobal('navigator', { geolocation: mockGeolocation });

describe('WeatherWidget', () => {
  it('renders weather data after fetching', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        current: { temperature_2m: 20, apparent_temperature: 18, relative_humidity_2m: 50, wind_speed_10m: 10, weather_code: 0 },
        daily: { time: ['2023-01-01', '2023-01-02'], temperature_2m_max: [25, 26], temperature_2m_min: [15, 16], weather_code: [0, 0], sunrise: ['2023-01-01T06:00'], sunset: ['2023-01-01T18:00'] }
      })
    });

    render(<WeatherWidget />);
    
    await waitFor(() => {
      expect(screen.getByText(/20/i)).toBeTruthy();
    });
  });
});
