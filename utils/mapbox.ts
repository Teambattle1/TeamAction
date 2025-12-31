import { Coordinate } from '../types';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

/**
 * Snaps a single point to the nearest road using Mapbox Snap to Route API
 */
export const snapPointToRoad = async (point: Coordinate): Promise<Coordinate> => {
    if (!MAPBOX_TOKEN) {
        console.warn('[Mapbox] No token provided. Returning original point.');
        return point;
    }

    try {
        const response = await fetch(
            `https://api.mapbox.com/matching/v5/mapbox/driving/${point.lng},${point.lat}?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `radiuses=50&` +
            `steps=true&` +
            `geometries=geojson`
        );

        if (!response.ok) {
            console.error('[Mapbox] Snap to road error:', response.statusText);
            return point;
        }

        const data = await response.json();

        if (!data.matchings || data.matchings.length === 0) {
            console.warn('[Mapbox] No road match found, returning original point');
            return point;
        }

        // Get the matched coordinate
        const matched = data.matchings[0];
        const coords = matched.geometry.coordinates[0];
        
        return {
            lng: coords[0],
            lat: coords[1]
        };
    } catch (error) {
        console.error('[Mapbox] Snap to road API error:', error);
        return point;
    }
};

/**
 * Snaps multiple points to roads in a single batch operation
 */
export const snapPointsToRoad = async (points: Coordinate[]): Promise<Coordinate[]> => {
    if (!MAPBOX_TOKEN) {
        console.warn('[Mapbox] No token provided. Returning original points.');
        return points;
    }

    // Mapbox API has rate limits, so process in batches
    const batchSize = 10;
    const snappedPoints: Coordinate[] = [];

    try {
        for (let i = 0; i < points.length; i += batchSize) {
            const batch = points.slice(i, i + batchSize);
            
            // Create coordinates string for API
            const coords = batch.map(p => `${p.lng},${p.lat}`).join(';');
            
            const response = await fetch(
                `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?` +
                `access_token=${MAPBOX_TOKEN}&` +
                `radiuses=${batch.map(() => 50).join(';')}&` +
                `steps=false&` +
                `geometries=geojson`
            );

            if (!response.ok) {
                console.error('[Mapbox] Batch snap error:', response.statusText);
                snappedPoints.push(...batch);
                continue;
            }

            const data = await response.json();

            if (!data.matchings) {
                snappedPoints.push(...batch);
                continue;
            }

            // Map matchings back to snapped coordinates
            data.matchings.forEach((matching: any, idx: number) => {
                if (matching.location) {
                    snappedPoints.push({
                        lng: matching.location[0],
                        lat: matching.location[1]
                    });
                } else {
                    snappedPoints.push(batch[idx]);
                }
            });
        }

        return snappedPoints;
    } catch (error) {
        console.error('[Mapbox] Batch snap to road error:', error);
        return points;
    }
};

/**
 * Calculates if a point is within a bounding box
 */
export const isPointInBox = (
    point: Coordinate,
    boxStart: Coordinate,
    boxEnd: Coordinate
): boolean => {
    const minLng = Math.min(boxStart.lng, boxEnd.lng);
    const maxLng = Math.max(boxStart.lng, boxEnd.lng);
    const minLat = Math.min(boxStart.lat, boxEnd.lat);
    const maxLat = Math.max(boxStart.lat, boxEnd.lat);

    return (
        point.lng >= minLng &&
        point.lng <= maxLng &&
        point.lat >= minLat &&
        point.lat <= maxLat
    );
};
