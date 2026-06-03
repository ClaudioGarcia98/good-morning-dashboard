import { useState, useEffect } from 'react';
import Greeting from './components/Greeting';
import Clock from './components/Clock';
import SearchBox from './components/SearchBox';
import SpeedDial from './components/SpeedDial';
import Quote from './components/Quote';
import WeatherWidget from './components/WeatherWidget';
import SettingsPanel from './components/SettingsPanel';
import AnimeSchedule from './components/AnimeSchedule';
import LofiPlayer from './components/LofiPlayer';
import { useSettings } from './context/useSettings';

export default function App() {
    const { 
        backgroundUrl, 
        backgroundIsVideo, 
        username,
        showWeatherWidget,
        showQuote,
        showSearchBox,
        showSpeedDial,
        showAnimeSchedule,
        showLofiPlayer
    } = useSettings();
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const bootT = setTimeout(() => setBooting(false), 2800);
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
            }, 120000); // 2 minutes
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
        events.forEach(ev => window.addEventListener(ev, resetIdle));
        resetIdle();

        return () => {
            events.forEach(ev => window.removeEventListener(ev, resetIdle));
            clearTimeout(idleT);
            clearTimeout(bootT);
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
            {booting && (
                <div id="bootScreen" className="boot-screen">
                    <div className="boot-logo">Hello, {username || 'Guest'}</div>
                </div>
            )}
            
            <main className={`interactive-ui ${booting ? 'boot-hidden' : ''}`} id="mainUi">
                <section style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    {showWeatherWidget && <WeatherWidget />}
                </section>
                <div className="container">
                    <header className="center-content">
                        <Greeting />
                        <Clock />
                        <div style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out', marginBottom: '35px' }}>
                            {showQuote && <Quote />}
                        </div>
                    </header>
                    <section style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        {showSearchBox && <SearchBox />}
                        {showSpeedDial && <SpeedDial />}
                        {showAnimeSchedule && (
                            <div className="scrollable-section">
                                <AnimeSchedule />
                            </div>
                        )}
                    </section>
                </div>
                <aside style={{ opacity: 'var(--ui-opacity)', transition: 'opacity 0.8s ease-in-out' }}>
                    <SettingsPanel />
                    {showLofiPlayer && <LofiPlayer />}
                </aside>
            </main>
        </>
    );
}
