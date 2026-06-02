import React, { useEffect } from 'react';
import Greeting from './components/Greeting';
import Clock from './components/Clock';
import SearchBox from './components/SearchBox';
import SpeedDial from './components/SpeedDial';
import Quote from './components/Quote';
import WeatherWidget from './components/WeatherWidget';
import SettingsPanel from './components/SettingsPanel';
import AnimeSchedule from './components/AnimeSchedule';
import { useSettings } from './context/SettingsContext';

export default function App() {
    const { backgroundUrl, backgroundIsVideo } = useSettings();

    useEffect(() => {
        let idleT;
        const mainUi = document.getElementById('mainUi');
        
        const resetIdle = () => {
            document.documentElement.style.setProperty('--ui-opacity', '1');
            document.body.classList.remove('idle');
            if (mainUi) mainUi.style.pointerEvents = 'auto';
            clearTimeout(idleT);
            idleT = setTimeout(() => {
                if (document.activeElement !== document.getElementById('searchInput')) {
                    document.documentElement.style.setProperty('--ui-opacity', '0.2');
                    document.body.classList.add('idle');
                    window.dispatchEvent(new Event('app-idle'));
                }
            }, 5000);
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
        events.forEach(ev => window.addEventListener(ev, resetIdle));
        resetIdle();

        return () => {
            events.forEach(ev => window.removeEventListener(ev, resetIdle));
            clearTimeout(idleT);
        };
    }, []);

    useEffect(() => {
        if (backgroundUrl && !backgroundIsVideo) {
            Object.assign(document.body.style, {
                backgroundImage: `url('${backgroundUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            });
        } else {
            document.body.style.backgroundImage = 'none';
        }
    }, [backgroundUrl, backgroundIsVideo]);

    return (
        <>
            {backgroundIsVideo && backgroundUrl && (
                <video
                    src={backgroundUrl}
                    autoPlay
                    loop
                    muted
                    style={{
                        position: 'absolute',
                        top: 0, left: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        zIndex: 0
                    }}
                />
            )}
            <div className="overlay" id="overlay"></div>
            <div className="interactive-ui" id="mainUi">
                <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    <WeatherWidget />
                </div>
                <div className="container">
                    <div className="center-content">
                        <Greeting />
                        <Clock />
                        <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out', marginBottom: '35px' }}>
                            <Quote />
                        </div>
                    </div>
                    <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                        <SearchBox />
                        <SpeedDial />
                        <AnimeSchedule />
                    </div>
                </div>
                <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    <SettingsPanel />
                </div>
            </div>
        </>
    );
}
