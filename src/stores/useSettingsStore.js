import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
    persist(
        (set) => ({
            // Persisted — initial values read from legacy dash_* keys for backward compat
            theme:            localStorage.getItem('dash_theme')                || 'aurora',
            font:             localStorage.getItem('dash_font')                 || 'default',
            clockMode:        localStorage.getItem('dash_clock')                || 'digital',
            username:         localStorage.getItem('dash_username')             || 'Cláudio',
            malUsername:      localStorage.getItem('dash_mal_username')         || '',
            fallbackCity:     localStorage.getItem('dash_fallback_city')        || '',
            use24hClock:      localStorage.getItem('dash_24h')                  !== 'false',
            useCelsius:       localStorage.getItem('dash_celsius')              !== 'false',
            gifName:          localStorage.getItem('dash_gif_name')             || '',
            lofiId:           localStorage.getItem('dash_lofi_id')              || 'Gu-g8FRG4Zs',
            customLofiId:     localStorage.getItem('dash_custom_lofi')          || localStorage.getItem('dash_lofi_id') || 'Gu-g8FRG4Zs',
            volume:           parseFloat(localStorage.getItem('dash_volume'))   || 0.2,
            speedDials:       (() => { try { return JSON.parse(localStorage.getItem('dash_speed_dials') || '[]'); } catch { return []; } })(),
            customEngines:    (() => { try { return JSON.parse(localStorage.getItem('dash_custom_engines') || '[]'); } catch { return []; } })(),
            showWeatherWidget: localStorage.getItem('dash_show_weather')        !== 'false',
            showQuote:        localStorage.getItem('dash_show_quote')           !== 'false',
            showSearchBox:    localStorage.getItem('dash_show_search')          !== 'false',
            showSpeedDial:    localStorage.getItem('dash_show_speeddial')       !== 'false',
            showTop5Anime:    localStorage.getItem('dash_show_top5')            !== 'false',
            showAnimeSidebar: localStorage.getItem('dash_show_anime_sidebar')   !== 'false',
            showLofiPlayer:   localStorage.getItem('dash_show_lofi')            !== 'false',

            // Ephemeral — not persisted
            backgroundUrl:    null,
            backgroundIsVideo: false,
            malError:         false,
            malLoading:       false,
            malSuccess:       false,

            // Actions
            setTheme:             (theme)           => set({ theme }),
            setFont:              (font)            => set({ font }),
            setClockMode:         (clockMode)       => set({ clockMode }),
            setUsername:          (username)        => set({ username }),
            setMalUsername:       (malUsername)     => set({ malUsername }),
            setFallbackCity:      (fallbackCity)    => set({ fallbackCity }),
            setUse24hClock:       (use24hClock)     => set({ use24hClock }),
            setUseCelsius:        (useCelsius)      => set({ useCelsius }),
            setGifName:           (gifName)         => set({ gifName }),
            setLofiId:            (lofiId)          => set({ lofiId }),
            setCustomLofiId:      (customLofiId)    => set({ customLofiId }),
            setVolume:            (volume)          => set({ volume }),
            setSpeedDials:        (speedDials)      => set({ speedDials }),
            setCustomEngines:     (customEngines)   => set({ customEngines }),
            setBackgroundUrl:     (backgroundUrl)   => set({ backgroundUrl }),
            setBackgroundIsVideo: (backgroundIsVideo) => set({ backgroundIsVideo }),
            setMalError:          (malError)        => set({ malError }),
            setMalLoading:        (malLoading)      => set({ malLoading }),
            setMalSuccess:        (malSuccess)      => set({ malSuccess }),
            setShowWeatherWidget: (v) => set({ showWeatherWidget: v }),
            setShowQuote:         (v) => set({ showQuote: v }),
            setShowSearchBox:     (v) => set({ showSearchBox: v }),
            setShowSpeedDial:     (v) => set({ showSpeedDial: v }),
            setShowTop5Anime:     (v) => set({ showTop5Anime: v }),
            setShowAnimeSidebar:  (v) => set({ showAnimeSidebar: v }),
            setShowLofiPlayer:    (v) => set({ showLofiPlayer: v }),
        }),
        {
            name: 'dash_settings',
            partialize: (s) => ({
                theme: s.theme, font: s.font, clockMode: s.clockMode,
                username: s.username, malUsername: s.malUsername, fallbackCity: s.fallbackCity,
                use24hClock: s.use24hClock, useCelsius: s.useCelsius, gifName: s.gifName,
                lofiId: s.lofiId, customLofiId: s.customLofiId, volume: s.volume,
                speedDials: s.speedDials, customEngines: s.customEngines,
                showWeatherWidget: s.showWeatherWidget, showQuote: s.showQuote,
                showSearchBox: s.showSearchBox, showSpeedDial: s.showSpeedDial,
                showTop5Anime: s.showTop5Anime, showAnimeSidebar: s.showAnimeSidebar,
                showLofiPlayer: s.showLofiPlayer,
            }),
        }
    )
);
