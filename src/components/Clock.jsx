import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function Clock() {
    const { clockMode } = useSettings();
    const [timeStr, setTimeStr] = useState('00:00');
    const [dateStr, setDateStr] = useState('');
    const canvasRef = useRef(null);

    useEffect(() => {
        const updateDigital = () => {
            const now = new Date();
            setTimeStr(
                String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
            );
            setDateStr(
                now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            );
        };
        
        updateDigital();
        const interval = setInterval(updateDigital, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (clockMode === 'digital') return;
        
        let reqId;
        const renderAnalog = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const sz = canvas.width;
            const cx = sz / 2;
            const cy = sz / 2;
            const r = sz / 2 - 3;
            const now = new Date();

            ctx.clearRect(0, 0, sz, sz);
            
            // face
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // hour ticks
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
                const major = i % 3 === 0;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * (r - (major ? 10 : 6)),
                           cy + Math.sin(a) * (r - (major ? 10 : 6)));
                ctx.lineTo(cx + Math.cos(a) * (r - 2),
                           cy + Math.sin(a) * (r - 2));
                ctx.strokeStyle = major ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)';
                ctx.lineWidth = major ? 2 : 1;
                ctx.stroke();
            }

            const hand = (angle, len, w, color) => {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
                ctx.strokeStyle = color;
                ctx.lineWidth = w;
                ctx.lineCap = 'round';
                ctx.stroke();
            };

            const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#FFD26A';
            
            hand(((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2, r * 0.50, sz < 100 ? 2 : 3, 'rgba(255,255,255,0.92)');
            hand(((m + s / 60) / 60) * Math.PI * 2 - Math.PI / 2, r * 0.72, sz < 100 ? 1.5 : 2, 'rgba(255,255,255,0.92)');
            hand((s / 60) * Math.PI * 2 - Math.PI / 2, r * 0.82, 1, accentColor);
            
            ctx.beginPath();
            ctx.arc(cx, cy, sz < 100 ? 2.5 : 3.5, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.fill();

            reqId = requestAnimationFrame(renderAnalog);
        };
        
        reqId = requestAnimationFrame(renderAnalog);
        return () => cancelAnimationFrame(reqId);
    }, [clockMode]);

    const analogSize = clockMode === 'analog' ? 150 : 90;

    return (
        <>
            <div className={`clock-row mode-${clockMode}`} id="clockRow">
                <div id="time">{timeStr}</div>
                <div id="analogWrap">
                    <canvas ref={canvasRef} id="analogCanvas" width={analogSize} height={analogSize}></canvas>
                </div>
            </div>
            <div id="date">{dateStr}</div>
        </>
    );
}
