import { useState, useEffect } from 'react';

const FALLBACK_QUOTES = [
    "Focus on the process, not just the outcome.",
    "Small daily progress adds up to massive results.",
    "Simplicity is the ultimate sophistication.",
    "Make it work, make it right, make it fast.",
    "Your focus determines your reality.",
    "Consistency beats intensity every single time."
];

export default function Quote() {
    const [quote, setQuote] = useState("Loading inspiration…");
    const [opacity, setOpacity] = useState(0.85);

    const generateNewQuote = async () => {
        setOpacity(0);
        
        try {
            const res = await fetch('https://dummyjson.com/quotes/random');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            
            setTimeout(() => {
                setQuote(`"${data.quote}" — ${data.author}`);
                setOpacity(0.85);
            }, 200);
        } catch (error) {
            setTimeout(() => {
                setQuote(`"${FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]}"`);
                setOpacity(0.85);
            }, 200);
        }
    };

    useEffect(() => {
        generateNewQuote();
    }, []);

    return (
        <div 
            id="quote" 
            title="Click for new quote" 
            aria-label="Inspirational quote. Click for a new one."
            onClick={generateNewQuote}
            style={{ opacity, transition: 'opacity 0.3s ease' }}
            tabIndex="0"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') generateNewQuote(); }}
        >
            {quote}
        </div>
    );
}
