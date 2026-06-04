import { useEffect } from 'react';
import { FONTS } from '../context/settingsConstants';
import { useSettingsStore } from '../stores/useSettingsStore';

export function useFontEffect() {
    const font = useSettingsStore(s => s.font);

    useEffect(() => {
        const f = FONTS[font] || FONTS.default;
        if (f.url && !document.getElementById('gf-' + font)) {
            const l = document.createElement('link');
            l.id = 'gf-' + font; l.rel = 'stylesheet'; l.href = f.url;
            document.head.appendChild(l);
        }
        document.documentElement.style.setProperty('--font-family', f.family);
    }, [font]);
}
