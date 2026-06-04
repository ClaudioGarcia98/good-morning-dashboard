import { useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import defaultVideo from '../assets/animated_gif.mp4';

export function useBackgroundLoader() {
    const setBackgroundUrl = useSettingsStore(s => s.setBackgroundUrl);
    const setBackgroundIsVideo = useSettingsStore(s => s.setBackgroundIsVideo);

    useEffect(() => {
        let blobUrl = null;

        const loadBlob = async () => {
            try {
                const db = await new Promise((res, rej) => {
                    const r = indexedDB.open('dashDB', 1);
                    r.onupgradeneeded = e => e.target.result.createObjectStore('s');
                    r.onsuccess = e => res(e.target.result);
                    r.onerror = e => rej(e.target.error);
                });
                return new Promise((res, rej) => {
                    const r = db.transaction('s', 'readonly').objectStore('s').get('bg');
                    r.onsuccess = e => res(e.target.result || null);
                    r.onerror = e => rej(e.target.error);
                });
            } catch { return null; }
        };

        loadBlob().then(blob => {
            if (blob) {
                blobUrl = URL.createObjectURL(blob);
                setBackgroundUrl(blobUrl);
                setBackgroundIsVideo(blob.type && blob.type.startsWith('video/'));
            } else {
                setBackgroundUrl(defaultVideo);
                setBackgroundIsVideo(defaultVideo.endsWith('.mp4'));
            }
        });

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [setBackgroundUrl, setBackgroundIsVideo]);
}
