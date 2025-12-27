
import { Coordinate } from '../types';

export const parseGPX = async (file: File): Promise<Coordinate[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "text/xml");
                
                const coords: Coordinate[] = [];
                
                // Use getElementsByTagName to ignore namespaces (e.g. gpx:trkpt vs trkpt)
                // This is more robust than querySelectorAll for XML with namespaces in some browsers
                
                // 1. Try Tracks
                const trkpts = Array.from(xml.getElementsByTagName('trkpt'));
                trkpts.forEach(pt => {
                    const lat = parseFloat(pt.getAttribute('lat') || '0');
                    const lon = parseFloat(pt.getAttribute('lon') || '0');
                    if (lat !== 0 && lon !== 0) coords.push({ lat, lng: lon });
                });

                // 2. Try Routes if no track points
                if (coords.length === 0) {
                    const rtepts = Array.from(xml.getElementsByTagName('rtept'));
                    rtepts.forEach(pt => {
                        const lat = parseFloat(pt.getAttribute('lat') || '0');
                        const lon = parseFloat(pt.getAttribute('lon') || '0');
                        if (lat !== 0 && lon !== 0) coords.push({ lat, lng: lon });
                    });
                }

                // 3. Try Waypoints if still empty (though less common for routes)
                if (coords.length === 0) {
                    const wpts = Array.from(xml.getElementsByTagName('wpt'));
                    wpts.forEach(pt => {
                        const lat = parseFloat(pt.getAttribute('lat') || '0');
                        const lon = parseFloat(pt.getAttribute('lon') || '0');
                        if (lat !== 0 && lon !== 0) coords.push({ lat, lng: lon });
                    });
                }

                if (coords.length < 2 && coords.length > 0) {
                    // Single point found, still valid but might be just a waypoint
                    resolve(coords);
                } else if (coords.length >= 2) {
                    resolve(coords);
                } else {
                    reject(new Error("No valid GPS points found in file. Ensure it is a valid GPX format with tracks or routes."));
                }
            } catch (err) {
                reject(err);
            }
        };
        
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};
