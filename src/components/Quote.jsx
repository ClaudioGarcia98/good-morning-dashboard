import React from 'react';
import { useState, useEffect } from 'react';

const ANIME_QUOTES = [
    { text: "A lesson without pain is meaningless. For you cannot gain anything without sacrificing something else in return.", author: "Edward Elric", anime: "Fullmetal Alchemist" },
    { text: "If you don't take risks, you can't create a future.", author: "Monkey D. Luffy", anime: "One Piece" },
    { text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", author: "Kenshin Himura", anime: "Rurouni Kenshin" },
    { text: "Fools who don't respect the past are likely to repeat it.", author: "Nico Robin", anime: "One Piece" },
    { text: "Hard work is worthless for those that don't believe in themselves.", author: "Naruto Uzumaki", anime: "Naruto" },
    { text: "People, who can’t throw something important away, can never hope to change anything.", author: "Armin Arlert", anime: "Attack on Titan" },
    { text: "The only ones who should kill, are those who are prepared to be killed.", author: "Lelouch Lamperouge", anime: "Code Geass" },
    { text: "If you wanna make people dream, you've gotta start by believing in that dream yourself!", author: "Seiya Kanie", anime: "Amagi Brilliant Park" },
    { text: "A dropout will beat a genius through hard work.", author: "Rock Lee", anime: "Naruto" },
    { text: "If you just submit yourself to fate, then that's the end of it.", author: "Keiichi Maebara", anime: "Higurashi" },
    { text: "If you win, you live. If you lose, you die. If you don't fight, you can't win.", author: "Eren Yeager", anime: "Attack on Titan" },
    { text: "Don't give up, there's no shame in falling down! True shame is to not stand up again!", author: "Shintaro Midorima", anime: "Kuroko's Basketball" },
    { text: "Sometimes I do feel like I'm a failure. Like there's no hope for me. But even so, I'm not gonna give up. Ever!", author: "Izuku Midoriya", anime: "My Hero Academia" },
    { text: "The world isn't perfect. But it's there for us, doing the best it can. That's what makes it so damn beautiful.", author: "Roy Mustang", anime: "Fullmetal Alchemist" },
    { text: "Remember that everyone you meet is afraid of something, loves something and has lost something.", author: "Lucy Heartfilia", anime: "Fairy Tail" },
    { text: "It's just a pathetic excuse to say someone is talented.", author: "Itachi Uchiha", anime: "Naruto" },
    { text: "Even if I'm weak, even if I have no power. I'm going to protect them all.", author: "Natsuki Subaru", anime: "Re:Zero" },
    { text: "The ticket to the future is always open.", author: "Vash the Stampede", anime: "Trigun" },
    { text: "Knowing you're different is only the beginning. If you accept these differences you'll be able to get past them and grow even closer.", author: "Miss Kobayashi", anime: "Miss Kobayashi's Dragon Maid" },
    { text: "You can die anytime, but living takes true courage.", author: "Kenshin Himura", anime: "Rurouni Kenshin" }
];

export default React.memo(function Quote() {
    const [quoteObj, setQuoteObj] = useState(() => {
        const randomIndex = Math.floor(Math.random() * ANIME_QUOTES.length);
        return ANIME_QUOTES[randomIndex];
    });
    const [opacity, setOpacity] = useState(1);

    const generateNewQuote = async () => {
        setOpacity(0);
        
        let newQuote = null;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch('https://animechan.io/api/v1/quotes/random', { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error('API down');
            const data = await res.json();
            
            if (data.quote) {
                newQuote = { text: data.quote, author: data.character, anime: data.anime };
            } else if (data.data && data.data.content) {
                newQuote = { text: data.data.content, author: data.data.character.name, anime: data.data.anime.name };
            } else {
                throw new Error('Invalid format');
            }
        } catch (err) {
            const randomIndex = Math.floor(Math.random() * ANIME_QUOTES.length);
            newQuote = ANIME_QUOTES[randomIndex];
        }

        setTimeout(() => {
            setQuoteObj(newQuote);
            setOpacity(1);
        }, 300);
    };

    useEffect(() => {
        const intervalId = setInterval(generateNewQuote, 60 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    if (!quoteObj) return null;

    return (
        <div 
            id="quote-container" 
            title="Click for a new quote" 
            onClick={generateNewQuote}
            style={{ opacity, transition: 'opacity 0.4s ease' }}
            tabIndex="0"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') generateNewQuote(); }}
        >
            <div className="quote-content">
                <span className="quote-text">"{quoteObj.text}"</span>
                <span className="quote-author">
                    {quoteObj.author} <span className="quote-anime">({quoteObj.anime})</span>
                </span>
            </div>
        </div>
    );
});
