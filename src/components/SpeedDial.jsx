import { useSettings } from '../context/SettingsContext';

export default function SpeedDial() {
    const { speedDials } = useSettings();

    const getFavicon = (url) => {
        try {
            const dom = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${dom}&sz=32`;
        } catch {
            return '';
        }
    };

    return (
        <nav className="speed-dial" aria-label="Quick Links">
            {speedDials.map((link) => (
                <a 
                    key={link.id} 
                    href={link.url} 
                    className="speed-dial-item" 
                    title={link.name} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={link.name}
                >
                    <img 
                        src={getFavicon(link.url)} 
                        alt={link.name} 
                        style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </a>
            ))}
        </nav>
    );
}
