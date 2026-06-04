import { memo } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { THEMES, FONTS } from '../../context/settingsConstants';

export default memo(function ThemeSettings() {
    const { theme, setTheme, font, setFont, clockMode, setClockMode, use24hClock, setUse24hClock } = useSettingsStore(
        useShallow(s => ({
            theme: s.theme, setTheme: s.setTheme,
            font: s.font, setFont: s.setFont,
            clockMode: s.clockMode, setClockMode: s.setClockMode,
            use24hClock: s.use24hClock, setUse24hClock: s.setUse24hClock,
        }))
    );

    return (
        <>
            <div className="sp-section">
                <div className="sp-label">Theme</div>
                <div className="pill-row">
                    {Object.keys(THEMES).map(t => (
                        <button
                            key={t}
                            className={`pill ${theme === t ? 'active' : ''}`}
                            onClick={() => setTheme(t)}
                        >
                            <span className="tdot" style={{ background: THEMES[t].accent || '#FFD26A' }}></span>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sp-section">
                <div className="sp-label">Font</div>
                <div className="pill-row">
                    {Object.keys(FONTS).map(f => (
                        <button
                            key={f}
                            className={`pill ${font === f ? 'active' : ''}`}
                            onClick={() => setFont(f)}
                            style={{ fontFamily: FONTS[f].family }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sp-section">
                <div className="sp-label">Clock Style</div>
                <div className="pill-row">
                    {['digital', 'analog', 'both'].map(m => (
                        <button
                            key={m}
                            className={`pill ${clockMode === m ? 'active' : ''}`}
                            onClick={() => setClockMode(m)}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="sp-section">
                <div className="sp-label">Clock Format</div>
                <div className="pill-row">
                    <button
                        className={`pill ${!use24hClock ? 'active' : ''}`}
                        onClick={() => setUse24hClock(false)}
                    >
                        12-Hour
                    </button>
                    <button
                        className={`pill ${use24hClock ? 'active' : ''}`}
                        onClick={() => setUse24hClock(true)}
                    >
                        24-Hour
                    </button>
                </div>
            </div>
        </>
    );
});
