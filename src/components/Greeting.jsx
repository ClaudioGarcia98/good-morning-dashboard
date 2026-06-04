import { memo, useState, useEffect } from 'react';
import { useSettings } from '../context/useSettings';

export default memo(function Greeting() {
    const { username } = useSettings();
    const [greeting, setGreeting] = useState('');
    const [weatherCode, setWeatherCode] = useState(null);

    useEffect(() => {
        const handleWeather = (e) => setWeatherCode(e.detail);
        window.addEventListener('weather-update', handleWeather);
        return () => window.removeEventListener('weather-update', handleWeather);
    }, []);

    useEffect(() => {
        const updateGreeting = () => {
            const hr = new Date().getHours();
            let prefix = 'Good morning';
            
            if (hr >= 12 && hr < 18) {
                prefix = 'Good afternoon';
            } else if (hr >= 18 && hr < 22) {
                prefix = 'Good evening';
            } else if (hr >= 22 || hr < 5) {
                prefix = 'Time to rest';
            }

            // Weather modifier
            if (weatherCode !== null && prefix !== 'Time to rest') {
                if (weatherCode >= 51 && weatherCode <= 67) prefix = 'Cozy rainy ' + prefix.split(' ')[1];
                else if (weatherCode >= 71 && weatherCode <= 77) prefix = 'Snowy ' + prefix.split(' ')[1];
                else if (weatherCode === 0) prefix = 'Clear skies this ' + prefix.split(' ')[1];
            }

            setGreeting(`${prefix}, ${username}`);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000); // update every minute
        return () => clearInterval(interval);
    }, [username, weatherCode]);

    return <div id="greeting">{greeting}</div>;
});
