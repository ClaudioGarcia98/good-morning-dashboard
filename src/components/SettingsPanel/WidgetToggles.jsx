import { memo } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';

const WIDGETS = [
    { label: 'Weather Widget',        key: 'showWeatherWidget' },
    { label: 'Quote of the Day',      key: 'showQuote' },
    { label: 'Search Box',            key: 'showSearchBox' },
    { label: 'Speed Dials',           key: 'showSpeedDial' },
    { label: "Today's Launch (Top 5)", key: 'showTop5Anime' },
    { label: 'Anime Sidebar',         key: 'showAnimeSidebar' },
    { label: 'Lofi Player',           key: 'showLofiPlayer' },
];

const SETTER_KEYS = {
    showWeatherWidget: 'setShowWeatherWidget',
    showQuote:         'setShowQuote',
    showSearchBox:     'setShowSearchBox',
    showSpeedDial:     'setShowSpeedDial',
    showTop5Anime:     'setShowTop5Anime',
    showAnimeSidebar:  'setShowAnimeSidebar',
    showLofiPlayer:    'setShowLofiPlayer',
};

export default memo(function WidgetToggles() {
    const state = useSettingsStore(useShallow(s => ({
        showWeatherWidget: s.showWeatherWidget, setShowWeatherWidget: s.setShowWeatherWidget,
        showQuote:         s.showQuote,         setShowQuote:         s.setShowQuote,
        showSearchBox:     s.showSearchBox,     setShowSearchBox:     s.setShowSearchBox,
        showSpeedDial:     s.showSpeedDial,     setShowSpeedDial:     s.setShowSpeedDial,
        showTop5Anime:     s.showTop5Anime,     setShowTop5Anime:     s.setShowTop5Anime,
        showAnimeSidebar:  s.showAnimeSidebar,  setShowAnimeSidebar:  s.setShowAnimeSidebar,
        showLofiPlayer:    s.showLofiPlayer,    setShowLofiPlayer:    s.setShowLofiPlayer,
    })));

    return (
        <div className="sp-section">
            <div className="sp-label">Dashboard Layout</div>
            <div className="sp-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {WIDGETS.map(({ label, key }) => {
                    const setter = state[SETTER_KEYS[key]];
                    const value = state[key];
                    return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button className={`pill ${!value ? 'active' : ''}`} onClick={() => setter(false)}>Hide</button>
                                <button className={`pill ${value ? 'active' : ''}`} onClick={() => setter(true)}>Show</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
