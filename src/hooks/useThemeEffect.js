import { useEffect } from 'react';
import { THEMES } from '../context/settingsConstants';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useThemeEffect() {
    const theme = useSettingsStore(s => s.theme);

    useEffect(() => {
        let intervalId;
        const t = THEMES[theme] || THEMES.aurora;

        const updateTimeAccent = () => {
            const hr = new Date().getHours();
            let a = '#FFD26A', g = 'rgba(255,210,106,0.2)';
            if (hr >= 12 && hr < 18) { a = '#FF9F43'; g = 'rgba(255,159,67,0.2)'; }
            else if (hr >= 18 && hr < 22) { a = '#54a0ff'; g = 'rgba(84,160,255,0.2)'; }
            else if (hr >= 22 || hr < 5)  { a = '#c482fb'; g = 'rgba(196,130,251,0.25)'; }
            document.documentElement.style.setProperty('--accent-color', a);
            document.documentElement.style.setProperty('--accent-glow', g);
        };

        if (!t.timeBased) {
            document.documentElement.style.setProperty('--accent-color', t.accent);
            document.documentElement.style.setProperty('--accent-glow', t.glow);
        } else {
            updateTimeAccent();
            intervalId = setInterval(updateTimeAccent, 60000);
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.background = `linear-gradient(90deg, ${t.overlayA} 0%, ${t.overlayB} 50%, rgba(0,0,0,0) 100%)`;
        }

        return () => { if (intervalId) clearInterval(intervalId); };
    }, [theme]);
}
