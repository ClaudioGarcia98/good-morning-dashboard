import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/useSettings';

const ENGINES = {
    'yt ':    { name:'YouTube',    bg:'#FF0000', fg:'#fff', url: q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
    'r ':     { name:'Reddit',     bg:'#FF4500', fg:'#fff', url: q=>`https://www.reddit.com/search/?q=${encodeURIComponent(q)}` },
    'g ':     { name:'Google',     bg:'#4285F4', fg:'#fff', url: q=>`https://www.google.com/search?q=${encodeURIComponent(q)}` },
    'gh ':    { name:'GitHub',     bg:'#b0b0b0', fg:'#000', url: q=>`https://github.com/search?q=${encodeURIComponent(q)}` },
    'ddg ':   { name:'DuckDuckGo', bg:'#DE5833', fg:'#fff', url: q=>`https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
    'wiki ':  { name:'Wikipedia',  bg:'#a0b0bb', fg:'#000', url: q=>`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}` },
    'mdn ':   { name:'MDN',        bg:'#83d0f2', fg:'#000', url: q=>`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(q)}` },
    'tw ':    { name:'Twitter/X',  bg:'#1DA1F2', fg:'#fff', url: q=>`https://twitter.com/search?q=${encodeURIComponent(q)}` },
    'a ':     { name:'Amazon',     bg:'#FF9900', fg:'#000', url: q=>`https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
    'mal ':   { name:'MyAnimeList',bg:'#2E51A2', fg:'#fff', url: q=>`https://myanimelist.net/search/all?q=${encodeURIComponent(q)}` },
};

export default React.memo(function SearchBox() {
    const { customEngines, setSpeedDials } = useSettings();
    const [query, setQuery] = useState('');
    const [activeEngine, setActiveEngine] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [recent, setRecent] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusIdx, setFocusIdx] = useState(-1);

    // Combine default engines with custom engines
    const combinedEngines = { ...ENGINES };
    if (customEngines) {
        customEngines.forEach(e => {
            combinedEngines[e.prefix] = {
                name: e.name,
                bg: '#333',
                fg: '#fff',
                url: q => e.url.replace('%s', encodeURIComponent(q))
            };
        });
    }
    
    const inputRef = useRef(null);
    const formRef = useRef(null);
    const origQueryRef = useRef('');

    const loadRecent = () => {
        let h = JSON.parse(localStorage.getItem('dash_recent') || '[]');
        let needsSave = false;
        h = h.map(item => {
            if (!item.engineName) {
                needsSave = true;
                if (item.query.includes(': ')) {
                    const parts = item.query.split(': ');
                    item.engineName = parts[0];
                    item.query = parts.slice(1).join(': ');
                } else {
                    item.engineName = 'Google';
                }
            }
            return item;
        });
        if (needsSave) localStorage.setItem('dash_recent', JSON.stringify(h));
        setRecent(h);
    };

    useEffect(() => {
        const handleCtrlSpace = (e) => {
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };

        const handleClickOutside = (e) => {
            if (formRef.current && !formRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setFocusIdx(-1);
            }
        };

        document.addEventListener('keydown', handleCtrlSpace);
        document.addEventListener('click', handleClickOutside);
        
        loadRecent();

        return () => {
            document.removeEventListener('keydown', handleCtrlSpace);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const saveHistory = (q, url, engineName = 'Google') => {
        let h = JSON.parse(localStorage.getItem('dash_recent') || '[]');
        h = h.filter(x => x.query !== q);
        h.unshift({ query: q, url, engineName });
        const newH = h.slice(0, 8);
        localStorage.setItem('dash_recent', JSON.stringify(newH));
        setRecent(newH);
    };

    const removeHistory = (e, q) => {
        e.stopPropagation();
        let h = JSON.parse(localStorage.getItem('dash_recent') || '[]');
        h = h.filter(x => x.query !== q);
        localStorage.setItem('dash_recent', JSON.stringify(h));
        setRecent(h);
        if (h.length === 0) setShowSuggestions(false);
    };

    const latestRequestId = useRef(Date.now());

    const fetchSuggestions = (q, engine = activeEngine) => {
        const old = document.getElementById('gss');
        if (old) old.remove();
        
        const reqId = Date.now();
        latestRequestId.current = reqId;
        const cbName = `gsCb_${reqId}`;

        window[cbName] = (data) => {
            delete window[cbName];
            if (latestRequestId.current !== reqId) return;
            const sugs = data[1] || [];
            setSuggestions(sugs.slice(0, 5));
        };

        let src = '';
        if (!engine || engine.name === 'Google') {
            src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}&callback=${cbName}`;
        } else if (engine.name === 'YouTube') {
            src = `https://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(q)}&callback=${cbName}`;
        } else {
            delete window[cbName];
            setSuggestions([]);
            return;
        }

        const s = document.createElement('script');
        s.id = 'gss';
        s.src = src;
        document.body.appendChild(s);
    };

    const processQuery = (q) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        
        if (activeEngine) {
            const url = activeEngine.url(trimmed);
            saveHistory(trimmed, url, activeEngine.name);
            window.open(url, '_blank');
        } else {
            const urlPat = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?($|\?)/i;
            const ipPat  = /^https?:\/\/|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/;
            let url;
            if (urlPat.test(trimmed) || ipPat.test(trimmed)) {
                url = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
            } else {
                url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
            }
            saveHistory(trimmed, url, 'Google');
            window.open(url, '_blank');
        }
        
        setActiveEngine(null);
        setQuery('');
        setShowSuggestions(false);
    };

    const addToSpeedDial = (e, item) => {
        e.stopPropagation();
        e.preventDefault();
        
        const trimmed = item.trim();
        let url;
        let finalName = trimmed;
        
        if (activeEngine) {
            url = activeEngine.url(trimmed);
        } else {
            const urlPat = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?($|\?)/i;
            const ipPat  = /^https?:\/\/|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/;
            if (urlPat.test(trimmed) || ipPat.test(trimmed)) {
                url = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
                try {
                    const host = new URL(url).hostname.replace('www.', '').split('.')[0];
                    finalName = host.charAt(0).toUpperCase() + host.slice(1);
                } catch {}
            } else {
                url = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
            }
        }

        const newDial = {
            id: Date.now(),
            name: finalName,
            url: url
        };
        setSpeedDials(prev => [...prev, newDial]);
        setActiveEngine(null);
        setQuery('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setFocusIdx(-1);

        if (activeEngine) {
            origQueryRef.current = val;
            if (val === '') {
                setActiveEngine(null);
                setSuggestions([]);
                if (recent.length > 0) setShowSuggestions(true);
            } else {
                fetchSuggestions(val, activeEngine);
                setShowSuggestions(true);
            }
            return;
        }

        const low = val.toLowerCase();
        for (const [pfx, eng] of Object.entries(combinedEngines)) {
            if (low.startsWith(pfx)) {
                setActiveEngine({ ...eng, pfx });
                const rest = val.slice(pfx.length);
                setQuery(rest);
                origQueryRef.current = rest;
                if (rest) fetchSuggestions(rest, eng);
                else setSuggestions([]);
                setShowSuggestions(true);
                return;
            }
        }

        origQueryRef.current = val;
        if (!val.trim()) {
            setSuggestions([]);
            if (recent.length > 0) setShowSuggestions(true);
            else setShowSuggestions(false);
            return;
        }
        
        fetchSuggestions(val, null);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace' && activeEngine && query === '') {
            setActiveEngine(null);
            if (recent.length > 0) setShowSuggestions(true);
            return;
        }

        const itemsCount = query.trim() ? suggestions.length : recent.length;
        if (itemsCount === 0 || !showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = (focusIdx + 1) % itemsCount;
            setFocusIdx(nextIdx);
            setQuery(query.trim() ? suggestions[nextIdx] : recent[nextIdx].query);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const nextIdx = focusIdx <= -1 ? itemsCount - 1 : focusIdx - 1;
            setFocusIdx(nextIdx);
            setQuery(nextIdx === -1 ? origQueryRef.current : (query.trim() ? suggestions[nextIdx] : recent[nextIdx].query));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setFocusIdx(-1);
        }
    };

    const handleFocus = () => {
        if (!query.trim() && recent.length > 0) {
            setShowSuggestions(true);
        } else if (query.trim() && suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    const getFavicon = (url) => {
        try {
            const dom = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${dom}&sz=16`;
        } catch {
            return '';
        }
    };

    const isTyping = query.length > 0;

    return (
        <form 
            id="searchForm" 
            className={`search-container ${isTyping ? 'typing' : ''}`} 
            onSubmit={(e) => { e.preventDefault(); processQuery(query); }}
            ref={formRef}
        >
            <div className="search-icon"></div>
            
            <div 
                className={`engine-badge ${activeEngine ? 'show' : ''}`} 
                style={activeEngine ? { background: activeEngine.bg, color: activeEngine.fg } : {}}
            >
                {activeEngine?.name}
            </div>
            
            <input 
                type="text" 
                id="searchInput"
                ref={inputRef}
                placeholder="Let's search something"
                autoComplete="off" 
                autoFocus
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                style={{ paddingLeft: activeEngine ? '120px' : '52px' }} // Approximate width, ideally calculated
            />
            
            <ul 
                className="suggestions-list" 
                style={{ display: showSuggestions && (suggestions.length > 0 || (!query.trim() && recent.length > 0)) ? 'block' : 'none' }}
            >
                {query.trim() ? (
                    suggestions.map((item, idx) => (
                        <li 
                            key={item} 
                            className={idx === focusIdx ? 'selected' : ''}
                            onClick={() => processQuery(item)}
                        >
                            <span className="sug-icon">🔍</span>
                            <span className="sug-text" style={{ flex: 1 }}>{item}</span>
                            <button 
                                type="button"
                                className="sug-add" 
                                title="Add to Speed Dial" 
                                onClick={(e) => addToSpeedDial(e, item)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        </li>
                    ))
                ) : (
                    <>
                        {recent.length > 0 && <li className="sug-group">Recent</li>}
                        {recent.map((item, idx) => (
                            <li 
                                key={item.query}
                                className={idx === focusIdx ? 'selected' : ''}
                                onClick={() => {
                                    const engKey = Object.keys(combinedEngines).find(k => combinedEngines[k].name === item.engineName);
                                    if (engKey) {
                                        window.open(combinedEngines[engKey].url(item.query), '_blank');
                                    } else {
                                        processQuery(item.query);
                                    }
                                    setShowSuggestions(false);
                                    setQuery('');
                                }}
                            >
                                {item.url ? (
                                    <img src={getFavicon(item.url)} className="sug-favicon" onError={(e) => e.target.style.display='none'} alt=""/>
                                ) : (
                                    <span className="sug-icon">🕒</span>
                                )}
                                <span className="sug-text">{item.engineName}: {item.query}</span>
                                <button className="sug-remove" title="Remove" onClick={(e) => removeHistory(e, item.query)}>×</button>
                            </li>
                        ))}
                    </>
                )}
            </ul>
        </form>
    );
});
