import React, { useState, useEffect } from 'react';
import { Circle, useMap } from 'react-leaflet';
import { ShrinkingZone, ShrinkingZonePhase, Coordinate } from '../types';
import { AlertTriangle, Zap, Clock, Crosshair } from 'lucide-react';

interface ShrinkingZoneOverlayProps {
  zone: ShrinkingZone;
  userLocation?: Coordinate | null;
  onDamageApplied?: (damage: number) => void;
}

const ShrinkingZoneOverlay: React.FC<ShrinkingZoneOverlayProps> = ({ 
  zone, 
  userLocation,
  onDamageApplied 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isOutsideZone, setIsOutsideZone] = useState(false);
  const [damageAccumulated, setDamageAccumulated] = useState(0);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Check if user is outside zone and apply damage
  useEffect(() => {
    if (!userLocation) return;

    const distance = calculateDistance(userLocation, zone.currentCenter);
    const isOutside = distance > zone.currentRadius;
    setIsOutsideZone(isOutside);

    if (isOutside) {
      // Apply damage every second
      const damageInterval = setInterval(() => {
        const damage = zone.damagePerSecond;
        setDamageAccumulated(prev => {
          const newTotal = prev + damage;
          if (onDamageApplied) {
            onDamageApplied(damage);
          }
          return newTotal;
        });
      }, 1000);

      return () => clearInterval(damageInterval);
    } else {
      // Reset damage when back in zone
      setDamageAccumulated(0);
    }
  }, [userLocation, zone, onDamageApplied]);

  // Calculate current phase time remaining
  useEffect(() => {
    if (!zone.shrinkStartTime || zone.currentPhase >= zone.phases.length) return;

    const updateTimer = () => {
      const currentPhase = zone.phases[zone.currentPhase];
      const elapsed = Math.floor((Date.now() - (zone.shrinkStartTime || 0)) / 1000);
      const totalPhaseDuration = currentPhase.shrinkDuration + currentPhase.waitDuration;
      const remaining = Math.max(0, totalPhaseDuration - elapsed);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [zone]);

  const getCurrentPhase = (): ShrinkingZonePhase | null => {
    if (zone.currentPhase >= zone.phases.length) return null;
    return zone.phases[zone.currentPhase];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPhase = getCurrentPhase();
  const isShrinking = zone.shrinkStartTime && currentPhase && timeRemaining > currentPhase.waitDuration;

  return (
    <>
      {/* Map Circle - Safe Zone */}
      <Circle
        center={[zone.currentCenter.lat, zone.currentCenter.lng]}
        radius={zone.currentRadius}
        pathOptions={{
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.1,
          weight: 3,
          dashArray: '10, 10'
        }}
      />

      {/* Map Circle - Next Zone (if shrinking) */}
      {zone.targetRadius && zone.targetCenter && (
        <Circle
          center={[zone.targetCenter.lat, zone.targetCenter.lng]}
          radius={zone.targetRadius}
          pathOptions={{
            color: '#eab308',
            fillColor: 'transparent',
            fillOpacity: 0,
            weight: 2,
            dashArray: '5, 5'
          }}
        />
      )}

      {/* Warning Overlay - Outside Zone */}
      {isOutsideZone && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] pointer-events-none">
          <div className="bg-red-600/90 border-4 border-red-500 rounded-2xl p-6 shadow-2xl animate-pulse">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="w-16 h-16 text-white" />
              <p className="font-black text-2xl text-white uppercase tracking-wider">OUTSIDE SAFE ZONE!</p>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-4 py-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                <span className="text-xl font-black text-yellow-400">-{zone.damagePerSecond}/sec</span>
              </div>
              {damageAccumulated > 0 && (
                <p className="text-sm text-white font-bold">
                  Total Damage: <span className="text-red-300">{damageAccumulated}</span>
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Crosshair className="w-4 h-4 text-white" />
                <span className="text-xs text-white uppercase font-bold">Return to Green Zone</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Info Panel */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500 rounded-xl shadow-2xl p-4 min-w-[300px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              {isShrinking ? (
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <Crosshair className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-wider">
                {isShrinking ? 'Zone Shrinking!' : 'Safe Zone'}
              </h3>
              <p className="text-xs text-gray-400">
                Phase {zone.currentPhase + 1} of {zone.phases.length}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {/* Current Radius */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Current Radius:</span>
              <span className="text-sm font-bold text-white">{Math.round(zone.currentRadius)}m</span>
            </div>

            {/* Next Radius */}
            {currentPhase && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Next Radius:</span>
                <span className="text-sm font-bold text-yellow-400">{Math.round(currentPhase.radius)}m</span>
              </div>
            )}

            {/* Time Remaining */}
            {timeRemaining > 0 && currentPhase && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isShrinking ? 'Shrinking ends in:' : 'Next shrink in:'}
                </span>
                <span className={`text-sm font-black font-mono ${isShrinking ? 'text-red-400' : 'text-green-400'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            {/* Damage Rate */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Damage Outside:
              </span>
              <span className="text-sm font-bold text-red-400">-{zone.damagePerSecond}/sec</span>
            </div>
          </div>

          {/* Progress Bar */}
          {currentPhase && timeRemaining > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isShrinking ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${((currentPhase.shrinkDuration + currentPhase.waitDuration - timeRemaining) / (currentPhase.shrinkDuration + currentPhase.waitDuration)) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Warning */}
          {isShrinking && (
            <div className="mt-3 bg-red-500/20 border border-red-500 rounded-lg p-2">
              <p className="text-xs text-red-300 font-bold text-center animate-pulse">
                ⚠️ ZONE IS SHRINKING - MOVE TO NEW POSITION!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShrinkingZoneOverlay;
