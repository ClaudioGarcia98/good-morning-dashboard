import { memo, useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

const SunIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="var(--accent-color)" opacity="0.3" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
);

const PartlyCloudyIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2" />
        <circle cx="12" cy="12" r="4" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.1)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
);

const CloudIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
);

const RainIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <path d="M8 22l-1 2M12 22l-1 2M16 22l-1 2" />
    </svg>
);

const SnowIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <path d="M8 22h.01M12 22h.01M16 22h.01" strokeWidth="3" />
    </svg>
);

const StormIcon = () => (
    <svg className="weather-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.05)" />
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <path d="M13 22l-2 3h3l-2 3" />
    </svg>
);

const FeelsLikeIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
);

const HumidityIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 5-11.97L12 4.1 7 10.03A7 7 0 0 0 12 22z" />
    </svg>
);

const WindIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
);

const SunriseIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 22H6M12 18V2M12 2l-4 4M12 2l4 4M12 10a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" />
    </svg>
);

const SunsetIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 22H6M12 2v16M12 18l-4-4M12 18l4-4M12 10a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" />
    </svg>
);

const getIconType = (code) => {
    if (code === 0) return 'sun';
    if (code >= 1 && code <= 3) return 'partly-cloudy';
    if (code >= 45 && code <= 48) return 'cloud';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 95) return 'storm';
    return 'sun';
};

const getIconClassName = (type) => {
    if (type === 'sun') return 'weather-icon-sun';
    if (type === 'partly-cloudy' || type === 'cloud') return 'weather-icon-cloud';
    return 'weather-icon-rain';
};

const WeatherIcon = ({ type }) => {
    switch (type) {
        case 'sun': return <SunIcon />;
        case 'partly-cloudy': return <PartlyCloudyIcon />;
        case 'cloud': return <CloudIcon />;
        case 'rain': return <RainIcon />;
        case 'snow': return <SnowIcon />;
        case 'storm': return <StormIcon />;
        default: return <SunIcon />;
    }
};

export default memo(function WeatherWidget() {
    const useCelsius = useSettingsStore(s => s.useCelsius);
    const fallbackCity = useSettingsStore(s => s.fallbackCity);
    const [expanded, setExpanded] = useState(false);
    const [weather, setWeather] = useState(() => {
        try {
            const cached = localStorage.getItem('dash_weather_cache');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [error, setError] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const widgetRef = useRef(null);
    const panelRef = useRef(null);
    const prevFallbackCityRef = useRef(fallbackCity);

    useEffect(() => {
        if (prevFallbackCityRef.current !== fallbackCity) {
            localStorage.removeItem('dash_geo');
            localStorage.removeItem('dash_geo_ts');
            prevFallbackCityRef.current = fallbackCity;
        }
        const fetchWeather = async () => {
            setError(false);
            setWeather(null); // clear stale value immediately when unit changes
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

                    // 3. Try manual fallback city from settings (or default to London)
                    if (!resolved) {
                        const fbCity = fallbackCity || 'London';
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
                        setIsOffline(true);
                        if (!weather) {
                            setError(true);
                        }
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

                const iconType = getIconType(c.weather_code);
                const fmt = iso => {
                    if (!iso) return '--:--';
                    const dObj = new Date(iso);
                    if (isNaN(dObj.getTime())) return '--:--';
                    return dObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                };

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
                            iconType: getIconType(d.daily.weather_code[i]),
                            max: maxTemp,
                            min: minTemp
                        });
                    }
                }

                const unitStr = useCelsius ? '°C' : '°F';
                const weatherData = {
                    iconType,
                    temp: Math.round(c.temperature_2m) + unitStr,
                    feelsLike: Math.round(c.apparent_temperature) + unitStr,
                    humidity: c.relative_humidity_2m + '%',
                    wind: Math.round(c.wind_speed_10m) + ' km/h',
                    sunrise: d.daily && d.daily.sunrise && d.daily.sunrise[0] ? fmt(d.daily.sunrise[0]) : '--:--',
                    sunset: d.daily && d.daily.sunset && d.daily.sunset[0] ? fmt(d.daily.sunset[0]) : '--:--',
                    forecast,
                    timestamp: Date.now()
                };

                setWeather(weatherData);
                localStorage.setItem('dash_weather_cache', JSON.stringify(weatherData));
                setIsOffline(false);
                setError(false);

                window.dispatchEvent(new CustomEvent('weather-update', { detail: c.weather_code }));
            } catch (err) {
                console.error("Weather fetch failed:", err);
                setIsOffline(true);
                if (!weather) {
                    setError(true);
                }
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useCelsius, fallbackCity]);

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

    if (!weather && !error) {
        return (
            <div className="weather-widget loading" id="weatherWidget" aria-label="Loading weather">
                <div className="weather-loading-icon" />
                <div className="weather-loading-temp" />
            </div>
        );
    }

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
                <span id="weatherIcon" className={weather ? getIconClassName(weather.iconType) : ''} aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                    {weather ? <WeatherIcon type={weather.iconType} /> : null}
                </span>
                <span id="weatherTemp" style={{ color: 'var(--text-primary)' }}>{weather ? weather.temp : '--°C'}</span>
                <span className="weather-chevron" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isFallback && <span title="Location access denied. Showing fallback." style={{ fontSize: '0.8rem', marginRight: '4px' }}>📍</span>}
                    {isOffline && <span title="Offline. Displaying cached weather." style={{ fontSize: '0.8rem', marginRight: '4px', opacity: 0.8 }}>📡</span>}
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
                <div className="wd-row">
                    <span className="wd-label"><FeelsLikeIcon /> Feels like</span>
                    <span id="wFeels">{weather ? weather.feelsLike : '--°C'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><HumidityIcon /> Humidity</span>
                    <span id="wHumidity">{weather ? weather.humidity : '--%'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><WindIcon /> Wind</span>
                    <span id="wWind">{weather ? weather.wind : '-- km/h'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><SunriseIcon /> Sunrise</span>
                    <span id="wSunrise">{weather ? weather.sunrise : '--:--'}</span>
                </div>
                <div className="wd-row">
                    <span className="wd-label"><SunsetIcon /> Sunset</span>
                    <span id="wSunset">{weather ? weather.sunset : '--:--'}</span>
                </div>
                
                {weather?.forecast && weather.forecast.length > 0 && (
                    <div className="weather-forecast">
                        <div className="weather-forecast-title">3-Day Forecast</div>
                        <div className="weather-forecast-grid">
                            {weather.forecast.map((day, idx) => (
                                <div key={idx} className="weather-forecast-day">
                                    <span className="weather-forecast-name">{day.day}</span>
                                    <span className={`weather-forecast-icon ${getIconClassName(day.iconType)}`}>
                                        <WeatherIcon type={day.iconType} />
                                    </span>
                                    <div className="weather-forecast-temps">
                                        <span className="weather-forecast-max">{day.max}°</span>
                                        <span className="weather-forecast-min">{day.min}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isOffline && weather?.timestamp && (
                    <div style={{ fontSize: '0.68rem', opacity: 0.5, textAlign: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
                        Offline. Updated {new Date(weather.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </>
    );
});
