
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Coordinate } from '../types';
import { teamSync } from '../services/teamSync';

interface LocationContextType {
  userLocation: Coordinate | null;
  gpsAccuracy: number | null;
  error: string | null;
}

const LocationContext = createContext<LocationContextType>({
  userLocation: null,
  gpsAccuracy: null,
  error: null
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wakeLockRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);

  // Request Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('[Location] Wake Lock active');
          
          wakeLockRef.current.addEventListener('release', () => {
            console.log('[Location] Wake Lock released');
          });
        }
      } catch (err: any) {
        console.warn(`[Location] Wake Lock failed: ${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    // Re-acquire on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();

        // 1. Accuracy Filter: Ignore very bad signals (> 100m)
        if (accuracy > 100) return;

        // 2. Jitter Filter: Only update if moved effectively or significant time passed
        // (Simple implementation: Throttle to max 1 update per second to save renders)
        if (now - lastUpdateRef.current < 1000) return;

        lastUpdateRef.current = now;
        const newCoords = { lat: latitude, lng: longitude };
        
        setUserLocation(newCoords);
        setGpsAccuracy(accuracy);
        
        // Update Sync Service (without causing a React re-render elsewhere if internal)
        teamSync.updateLocation(newCoords);
      },
      (err) => {
        console.warn("[Location] Error", err);
        setError(err.message);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 10000 
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <LocationContext.Provider value={{ userLocation, gpsAccuracy, error }}>
      {children}
    </LocationContext.Provider>
  );
};
