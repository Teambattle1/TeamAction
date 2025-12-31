import React, { useState } from 'react';
import { Bomb, X, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { Coordinate } from '../types';

interface BombPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceBomb: (duration: 30 | 60 | 120) => void;
  bombsRemaining: number;
  userLocation?: Coordinate | null;
}

interface BombOption {
  duration: 30 | 60 | 120;
  label: string;
  color: string;
  borderColor: string;
  textColor: string;
  description: string;
}

const BOMB_OPTIONS: BombOption[] = [
  {
    duration: 30,
    label: '30 Second Bomb',
    color: '#991B1B',
    borderColor: '#DC2626',
    textColor: '#FCA5A5',
    description: 'Quick explosion - catch teams nearby',
  },
  {
    duration: 60,
    label: '1 Minute Bomb',
    color: '#92400E',
    borderColor: '#D97706',
    textColor: '#FCD34D',
    description: 'Medium timer - forces strategic choices',
  },
  {
    duration: 120,
    label: '2 Minute Bomb',
    color: '#78350F',
    borderColor: '#F59E0B',
    textColor: '#FEF3C7',
    description: 'Long timer - creates danger zone obstacles',
  },
];

/**
 * Modal for placing bombs in elimination mode
 * Teams can place up to 3 timed bombs to create danger zones
 * Each bomb creates a 30-meter danger zone for the specified duration
 */
const BombPlacementModal: React.FC<BombPlacementModalProps> = ({
  isOpen,
  onClose,
  onPlaceBomb,
  bombsRemaining,
  userLocation,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 120 | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPlacement = () => {
    if (!selectedDuration) return;

    if (!userLocation) {
      alert('Your location is not available. Make sure GPS is enabled.');
      return;
    }

    setIsConfirming(true);
    onPlaceBomb(selectedDuration);

    // Reset state
    setTimeout(() => {
      setSelectedDuration(null);
      setIsConfirming(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-700 rounded-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bomb className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-white">PLACE BOMB</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Location Check */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
          <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-300">Current Location</div>
            {userLocation ? (
              <div className="text-[10px] text-slate-400 mt-1">
                Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
              </div>
            ) : (
              <div className="text-[10px] text-red-300 mt-1">⚠ Location unavailable - enable GPS</div>
            )}
          </div>
        </div>

        {/* Bombs Remaining */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
          <Bomb className="w-4 h-4 text-red-400" />
          <div>
            <div className="text-xs font-bold text-slate-300">Bombs Remaining</div>
            <div className="text-sm font-bold text-orange-400">{bombsRemaining}/3</div>
          </div>
        </div>

        {/* Bomb Duration Options */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Select Duration</div>

          {BOMB_OPTIONS.map(option => (
            <button
              key={option.duration}
              onClick={() => setSelectedDuration(option.duration)}
              disabled={isConfirming || bombsRemaining === 0}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedDuration === option.duration
                  ? `border-${option.borderColor} bg-red-950 opacity-100`
                  : `border-slate-700 bg-slate-800 hover:border-slate-600 ${
                      bombsRemaining === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`
              }`}
              style={{
                borderColor: selectedDuration === option.duration ? option.borderColor : undefined,
                backgroundColor: selectedDuration === option.duration ? option.color : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="font-bold text-white mb-1">{option.label}</div>
                  <div className="text-xs text-slate-300">{option.description}</div>
                </div>
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: option.color }}>
                    <Clock className="w-3 h-3" />
                    <span className="text-xs font-bold">{option.duration}s</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Danger Zone Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-300">Danger Zone Effect</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Creates a 30-meter radius danger zone. Teams caught inside lose 300 points.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPlacement}
            disabled={!selectedDuration || isConfirming || bombsRemaining === 0 || !userLocation}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Placing...
              </>
            ) : (
              <>
                <Bomb className="w-4 h-4" />
                Place Bomb
              </>
            )}
          </button>
        </div>

        {/* Rules */}
        <div className="pt-2 border-t border-slate-700">
          <div className="text-[10px] text-slate-500 space-y-1">
            <p>• Each team gets 3 bombs per game</p>
            <p>• Place bombs at your current location</p>
            <p>• 30-meter radius from bomb center</p>
            <p>• Teams in zone at detonation lose 300 points</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BombPlacementModal;
