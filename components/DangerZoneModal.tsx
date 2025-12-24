
import React, { useState } from 'react';
import { DangerZone } from '../types';
import { X, Skull, AlertTriangle, Clock, Trash2, CheckCircle, Crosshair } from 'lucide-react';

interface DangerZoneModalProps {
  zone: DangerZone;
  onSave: (updatedZone: DangerZone) => void;
  onDelete: () => void;
  onClose: () => void;
}

const DangerZoneModal: React.FC<DangerZoneModalProps> = ({ zone, onSave, onDelete, onClose }) => {
  const [radius, setRadius] = useState(zone.radius);
  const [duration, setDuration] = useState(zone.duration || 10);
  const [penalty, setPenalty] = useState(zone.penalty);

  const handleSave = () => {
    onSave({
      ...zone,
      radius,
      duration,
      penalty
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-red-600 w-full max-w-sm rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-red-950/50 border-b border-red-900/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg shadow-lg animate-pulse">
                <Skull className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest">DANGER ZONE</h2>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wide">CONFIGURE THREAT LEVEL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Radius Slider */}
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Crosshair className="w-3 h-3" /> THREAT RADIUS
                    </label>
                    <span className="text-xl font-black text-white">{radius}m</span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    step="5" 
                    value={radius} 
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
            </div>

            {/* Duration Slider */}
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ESCAPE TIME
                    </label>
                    <span className="text-xl font-black text-white">{duration}s</span>
                </div>
                <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    step="1" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <p className="text-[10px] text-slate-500 italic">Time allowed before penalty strikes.</p>
            </div>

            {/* Penalty Input */}
            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> POINT PENALTY
                </label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={penalty} 
                        onChange={(e) => setPenalty(parseInt(e.target.value))}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-center text-2xl font-black text-red-500 outline-none focus:border-red-600 transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">POINTS</div>
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
            <button 
                onClick={onDelete}
                className="p-4 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                title="Delete Zone"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <button 
                onClick={handleSave}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
                <CheckCircle className="w-4 h-4" /> SAVE ZONE
            </button>
        </div>

      </div>
    </div>
  );
};

export default DangerZoneModal;
