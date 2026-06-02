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
    const { backgroundUrl } = useSettings();

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
        if (backgroundUrl) {
            Object.assign(document.body.style, {
                backgroundImage: `url('${backgroundUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            });
        }
    }, [backgroundUrl]);

    return (
        <>
            <div className="overlay" id="overlay"></div>
            <div className="interactive-ui" id="mainUi">
                <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    <WeatherWidget />
                </div>
                <div className="container">
                    <Greeting />
                    <Clock />
                    <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                        <SearchBox />
                        <SpeedDial />
                        <Quote />
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
