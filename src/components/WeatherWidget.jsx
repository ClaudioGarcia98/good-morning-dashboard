import { memo, useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/useSettings';

export default memo(function WeatherWidget() {
    const { useCelsius } = useSettings();
    const [expanded, setExpanded] = useState(false);
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const widgetRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                let lat, lon;
                const cached = localStorage.getItem('dash_geo');
                const cachedTs = parseInt(localStorage.getItem('dash_geo_ts') || '0', 10);
                if (cached && Date.now() - cachedTs < 3600000) {
                    ({ lat, lon } = JSON.parse(cached));
                } else {
                    // 1. Try GPS
                    let resolved = false;
                    let gpsResolved = false;
                    if (navigator.geolocation) {
                        try {
                            const pos = await new Promise((res, rej) =>
                                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                            );
                            lat = pos.coords.latitude;
                            lon = pos.coords.longitude;
                            resolved = true;
                            gpsResolved = true;
                        } catch (geoErr) {
                            console.warn('GPS denied or failed:', geoErr);
                        }
                    }

                    // 2. Try IP geolocation (HTTPS-compatible)
                    if (!resolved) {
                        try {
                            const ipRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
                            const ipData = await ipRes.json();
                            if (ipData.latitude && ipData.longitude) {
                                lat = ipData.latitude;
                                lon = ipData.longitude;
                                resolved = true;
                                console.info(`IP geolocation resolved to ${ipData.city}`);
                            }
                        } catch (ipErr) {
                            console.warn('IP geolocation failed:', ipErr);
                        }
                    }

                    // 3. Try manual fallback city from settings
                    if (!resolved) {
                        const fbCity = localStorage.getItem('dash_fallback_city');
                        if (fbCity) {
                            console.info(`Trying manual fallback city: ${fbCity}`);
                            try {
                                const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fbCity)}&count=1`);
                                const geoData = await geoRes.json();
                                if (geoData.results && geoData.results.length > 0) {
                                    lat = geoData.results[0].latitude;
                                    lon = geoData.results[0].longitude;
                                    resolved = true;
                                }
                            } catch (fbErr) {
                                console.warn('Fallback city geocoding failed:', fbErr);
                            }
                        }
                    }

                    if (!resolved) {
                        console.error('All location methods failed');
                        setError(true);
                        return;
                    }

                    if (!gpsResolved) setIsFallback(true);
                    localStorage.setItem('dash_geo', JSON.stringify({ lat, lon }));
                    localStorage.setItem('dash_geo_ts', String(Date.now()));
                }

                const unitParam = useCelsius ? '' : '&temperature_unit=fahrenheit';
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
                    `&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4` +
                    unitParam
                );
                const d = await res.json();
                const c = d.current;
                if (!c) return;

                const getIconInfo = (code) => {
                    if      (code >= 1  && code <= 3)  return { icon: '⛅', className: 'weather-icon-cloud' };
                    else if (code >= 45 && code <= 48) return { icon: '🌫️', className: 'weather-icon-cloud' };
                    else if (code >= 51 && code <= 67) return { icon: '🌧️', className: 'weather-icon-rain' };
                    else if (code >= 71 && code <= 77) return { icon: '❄️', className: 'weather-icon-rain' };
                    else if (code >= 80 && code <= 82) return { icon: '🌦️', className: 'weather-icon-rain' };
                    else if (code >= 95)               return { icon: '⛈️', className: 'weather-icon-rain' };
                    return { icon: '☀️', className: 'weather-icon-sun' };
                };

                const currentIconInfo = getIconInfo(c.weather_code);
                const fmt = iso => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                const forecast = [];
                if (d.daily && d.daily.time) {
                    // Skip today (index 0), get next 3 days
                    for (let i = 1; i <= 3; i++) {
                        if (!d.daily.time[i]) break;
                        const dateObj = new Date(d.daily.time[i]);
                        const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
                        const maxTemp = Math.round(d.daily.temperature_2m_max[i]);
                        const minTemp = Math.round(d.daily.temperature_2m_min[i]);
                        forecast.push({
                            day: dayName,
                            iconInfo: getIconInfo(d.daily.weather_code[i]),
                            max: maxTemp,
                            min: minTemp
                        });
                    }
                }

                const unitStr = useCelsius ? '°C' : '°F';
                setWeather({
                    iconInfo: currentIconInfo,
                    temp: Math.round(c.temperature_2m) + unitStr,
                    feelsLike: Math.round(c.apparent_temperature) + unitStr,
                    humidity: c.relative_humidity_2m + '%',
                    wind: Math.round(c.wind_speed_10m) + ' km/h',
                    sunrise: d.daily ? fmt(d.daily.sunrise[0]) : '--:--',
                    sunset: d.daily ? fmt(d.daily.sunset[0]) : '--:--',
                    forecast
                });

                window.dispatchEvent(new CustomEvent('weather-update', { detail: c.weather_code }));
            } catch (err) {
                console.error("Weather fetch failed:", err);
                setError(true);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
    }, [useCelsius]);

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

    if (error) {
        return (
            <button className="weather-widget" style={{ opacity: 0.6 }} title="Weather failed to load">
                <span className="weather-icon-cloud" style={{ display: 'flex', alignItems: 'center' }}>⚠️</span>
                <span style={{ color: 'var(--text-primary)' }}>Weather Error</span>
            </button>
        );
    }

    return (
        <>
            <button 
                className={`weather-widget ${expanded ? 'expanded' : ''}`} 
                id="weatherWidget"
                ref={widgetRef}
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label="Toggle Weather Details"
            >
                <span id="weatherIcon" className={weather?.iconInfo?.className || ''} aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                    {weather ? weather.iconInfo.icon : '☀️'}
                </span>
                <span id="weatherTemp" style={{ color: 'var(--text-primary)' }}>{weather ? weather.temp : '--°C'}</span>
                <span className="weather-chevron" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isFallback && <span title="Location access denied. Showing fallback." style={{ fontSize: '0.8rem', marginRight: '4px' }}>📍</span>}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
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
                
                {weather?.forecast && weather.forecast.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '8px', fontWeight: 'bold' }}>3-Day Forecast</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            {weather.forecast.map((day, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{day.day}</div>
                                    <div className={day.iconInfo.className} style={{ display: 'inline-block', fontSize: '1.2rem' }}>{day.iconInfo.icon}</div>
                                    <div style={{ fontSize: '0.75rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{day.max}°</span>
                                        <span style={{ opacity: 0.6, marginLeft: '4px' }}>{day.min}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});
