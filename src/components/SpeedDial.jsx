import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../context/useSettings';

export default React.memo(function () {
    const { speedDials, setSpeedDials } = useSettings();
    const [draggedId, setDraggedId] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const getFavicon = (url) => {
        try {
            const dom = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${dom}&sz=64`;
        } catch {
            return '';
        }
    };

    // Track mouse globally during drag for the custom ghost
    useEffect(() => {
        if (!draggedId) return;
        
        const handleDrag = (e) => {
            if (e.clientX > 0 || e.clientY > 0) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };
        
        window.addEventListener('dragover', handleDrag);
        return () => window.removeEventListener('dragover', handleDrag);
    }, [draggedId]);

    const handleDragStart = (e, id) => {
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', id);
            e.dataTransfer.effectAllowed = 'move';
            
            // Create an invisible image to hide the native browser drag ghost
            const dragImg = new Image(0, 0);
            dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(dragImg, 0, 0);
        }
        
        // Initial mouse pos
        setMousePos({ x: e.clientX, y: e.clientY });
        
        setTimeout(() => setDraggedId(id), 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragEnter = (e, targetId) => {
        e.preventDefault();
        if (!draggedId || targetId === draggedId) return;

        const oldIndex = speedDials.findIndex(s => s.id === draggedId);
        const newIndex = speedDials.findIndex(s => s.id === targetId);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newSpeedDials = [...speedDials];
            const [draggedItem] = newSpeedDials.splice(oldIndex, 1);
            newSpeedDials.splice(newIndex, 0, draggedItem);
            
            if (document.startViewTransition) {
                document.startViewTransition(() => setSpeedDials(newSpeedDials));
            } else {
                setSpeedDials(newSpeedDials);
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDraggedId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const draggedItem = speedDials.find(s => s.id === draggedId);

    return (
        <>
            <nav className="speed-dial" aria-label="Quick Links">
                {speedDials.map((link) => {
                    const isDragged = draggedId === link.id;

                    return (
                        <a 
                            key={link.id} 
                            href={link.url} 
                            className="speed-dial-item"
                            title={link.name} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            aria-label={link.name}
                            draggable
                            onDragStart={(e) => handleDragStart(e, link.id)}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, link.id)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            style={{
                                background: isDragged ? 'transparent' : '',
                                border: isDragged ? '2px dashed rgba(255, 255, 255, 0.4)' : '',
                                backdropFilter: isDragged ? 'none' : '',
                                WebkitBackdropFilter: isDragged ? 'none' : '',
                                transform: 'none',
                                boxShadow: 'none',
                                opacity: 1,
                                transition: 'all 0.2s ease',
                                viewTransitionName: `speed-dial-${link.id}`
                            }}
                        >
                            <img 
                                src={getFavicon(link.url)} 
                                alt={link.name} 
                                style={{ 
                                    width: '26px', 
                                    height: '26px', 
                                    borderRadius: '4px', 
                                    pointerEvents: 'none',
                                    opacity: isDragged ? 0 : 1,
                                    transition: 'opacity 0.2s ease'
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </a>
                    );
                })}
            </nav>

            {/* Custom Drag Ghost */}
            {draggedId && draggedItem && createPortal(
                <div 
                    className="custom-drag-ghost"
                    style={{ left: mousePos.x, top: mousePos.y }}
                >
                    <img 
                        src={getFavicon(draggedItem.url)} 
                        alt={draggedItem.name} 
                        style={{ width: '26px', height: '26px', borderRadius: '4px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                </div>,
                document.body
            )}
        </>
    );
});
