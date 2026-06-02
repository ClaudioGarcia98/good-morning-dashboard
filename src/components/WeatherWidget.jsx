import React, { useState, useEffect, useRef } from 'react';

export default function WeatherWidget() {
    const [expanded, setExpanded] = useState(false);
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState(false);
    const widgetRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!navigator.geolocation) return;
            try {
                let lat, lon;
                const cached = localStorage.getItem('dash_geo');
                const cachedTs = parseInt(localStorage.getItem('dash_geo_ts') || '0', 10);
                if (cached && Date.now() - cachedTs < 3600000) {
                    ({ lat, lon } = JSON.parse(cached));
                } else {
                    try {
                        const pos = await new Promise((res, rej) =>
                            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                        );
                        lat = pos.coords.latitude;
                        lon = pos.coords.longitude;
                    } catch (geoErr) {
                        // Fallback to Bombarral, Portugal
                        lat = 39.2667;
                        lon = -9.1667;
                    }
                    localStorage.setItem('dash_geo', JSON.stringify({ lat, lon }));
                    localStorage.setItem('dash_geo_ts', String(Date.now()));
                }

                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
                    `&daily=sunrise,sunset&timezone=auto&forecast_days=1`
                );
                const d = await res.json();
                const c = d.current;
                if (!c) return;

                const code = c.weather_code;
                let icon = '☀️';
                if      (code >= 1  && code <= 3)  icon = '⛅';
                else if (code >= 45 && code <= 48) icon = '🌫️';
                else if (code >= 51 && code <= 67) icon = '🌧️';
                else if (code >= 71 && code <= 77) icon = '❄️';
                else if (code >= 80 && code <= 82) icon = '🌦️';
                else if (code >= 95)               icon = '⛈️';

                const fmt = iso => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                setWeather({
                    icon,
                    temp: Math.round(c.temperature_2m) + '°C',
                    feelsLike: Math.round(c.apparent_temperature) + '°C',
                    humidity: c.relative_humidity_2m + '%',
                    wind: Math.round(c.wind_speed_10m) + ' km/h',
                    sunrise: d.daily ? fmt(d.daily.sunrise[0]) : '--:--',
                    sunset: d.daily ? fmt(d.daily.sunset[0]) : '--:--',
                });
            } catch (err) {
                if (err.code === 1) setError(true);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                widgetRef.current && !widgetRef.current.contains(event.target) &&
                panelRef.current && !panelRef.current.contains(event.target)
            ) {
                setExpanded(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (error) return null;

    return (
        <>
            <button 
                className={`weather-widget ${expanded ? 'expanded' : ''}`} 
                id="weatherWidget"
                ref={widgetRef}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label="Toggle Weather Details"
                style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', 
                    background: 'rgba(0,0,0,0.25)', padding: '8px 14px', borderRadius: '20px',
                    backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', 
                    border: '1px solid rgba(255,255,255,0.1)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    <span id="weatherIcon" aria-hidden="true">{weather ? weather.icon : '☀️'}</span>
                    <span id="weatherTemp">{weather ? weather.temp : '--°C'}</span>
                    <span className="weather-chevron" aria-hidden="true">▾</span>
                </div>
            </button>
            <div 
                className={`weather-panel ${expanded ? 'open' : ''}`} 
                id="weatherPanel"
                ref={panelRef}
                role="region"
                aria-label="Weather Details"
            >
                <div className="wd-row"><span>Feels like</span><span id="wFeels">{weather ? weather.feelsLike : '--°C'}</span></div>
                <div className="wd-row"><span>Humidity</span><span id="wHumidity">{weather ? weather.humidity : '--%'}</span></div>
                <div className="wd-row"><span>Wind</span><span id="wWind">{weather ? weather.wind : '-- km/h'}</span></div>
                <div className="wd-row"><span>🌅 Sunrise</span><span id="wSunrise">{weather ? weather.sunrise : '--:--'}</span></div>
                <div className="wd-row"><span>🌇 Sunset</span><span id="wSunset">{weather ? weather.sunset : '--:--'}</span></div>
            </div>
        </>
    );
}
