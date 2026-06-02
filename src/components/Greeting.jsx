import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function Greeting() {
    const { username } = useSettings();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const updateGreeting = () => {
            const hr = new Date().getHours();
            let timeOfDay = 'Good morning';
            if (hr >= 12 && hr < 18) {
                timeOfDay = 'Good afternoon';
            } else if (hr >= 18) {
                timeOfDay = 'Good evening';
            }
            setGreeting(`${timeOfDay}, ${username}`);
        };

        updateGreeting();
        const interval = setInterval(updateGreeting, 60000); // update every minute
        return () => clearInterval(interval);
    }, [username]);

    return <div id="greeting">{greeting}</div>;
}
