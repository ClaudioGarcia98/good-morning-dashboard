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

            // Weather modifier — full WMO code coverage
            if (weatherCode !== null && prefix !== 'Time to rest') {
                const t = prefix.split(' ')[1]; // morning / afternoon / evening
                if      (weatherCode === 0)                     prefix = `Clear skies this ${t}`;
                else if (weatherCode <= 2)                      prefix = `Beautiful ${t}`;
                else if (weatherCode === 3)                     prefix = `Overcast ${t}`;
                else if (weatherCode <= 48)                     prefix = `Foggy ${t}`;
                else if (weatherCode <= 55)                     prefix = `Drizzly ${t}`;
                else if (weatherCode <= 57)                     prefix = `Frosty ${t}`;
                else if (weatherCode <= 65)                     prefix = `Cozy rainy ${t}`;
                else if (weatherCode <= 67)                     prefix = `Icy ${t}`;
                else if (weatherCode <= 77)                     prefix = `Snowy ${t}`;
                else if (weatherCode <= 82)                     prefix = `Showery ${t}`;
                else if (weatherCode <= 86)                     prefix = `Snowy ${t}`;
                else if (weatherCode === 95)                    prefix = `Stormy ${t}`;
                else if (weatherCode >= 96)                     prefix = `Wild ${t}`;
            }

            setGreeting(`${prefix}, ${username}`);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000); // update every minute
        return () => clearInterval(interval);
    }, [username, weatherCode]);

    return <div id="greeting">{greeting}</div>;
});
