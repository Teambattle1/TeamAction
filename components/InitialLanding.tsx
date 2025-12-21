
import React from 'react';
import { Play, Plus, Edit2, MapPin, Footprints } from 'lucide-react';

interface InitialLandingProps {
  onAction: (action: 'PLAY' | 'CREATE' | 'EDIT') => void;
}

const InitialLanding: React.FC<InitialLandingProps> = ({ onAction }) => {
  // Generate a path of footprints
  const footprints = Array.from({ length: 12 }).map((_, i) => {
      const progress = i / 11;
      // S-curve trajectory
      // Start bottom-left (-10%), go to top-right (110%)
      const left = -10 + (progress * 120); 
      // Vertical movement with a sine wave variation
      const bottom = 10 + (progress * 80) + (Math.sin(progress * Math.PI * 2) * 20);
      // Rotation roughly following the tangent of the curve
      const rotate = 60 - (progress * 120) + (Math.cos(progress * Math.PI * 2) * 20);
      
      return { left: `${left}%`, bottom: `${bottom}%`, rotate, opacity: 0.15 + (Math.sin(progress * Math.PI) * 0.2) };
  });

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans uppercase relative overflow-hidden">
        {/* Background Layer - Dark Base */}
        <div className="absolute inset-0 bg-slate-950" />
        
        {/* Footprints Path Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
             {footprints.map((fp, i) => (
                 <div 
                    key={i}
                    className="absolute text-white transition-all duration-1000"
                    style={{ 
                        left: fp.left, 
                        bottom: fp.bottom, 
                        transform: `rotate(${fp.rotate}deg) scale(${1.5 + (i % 2) * 0.2})`, // Slight scale variation for left/right foot feel
                        opacity: fp.opacity
                    }}
                 >
                     <Footprints className="w-24 h-24" strokeWidth={1} />
                 </div>
             ))}
        </div>
        
        {/* Radial Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/90 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center w-full max-w-sm animate-in fade-in zoom-in duration-500">
            {/* Logo Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500 ring-4 ring-white/10 relative">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/20 to-transparent" />
                <MapPin className="w-12 h-12 text-white drop-shadow-md relative z-10" />
            </div>
            
            {/* Title Section */}
            <div className="text-center mb-10">
                <h1 className="text-5xl font-black tracking-[0.1em] text-white drop-shadow-2xl mb-4 leading-none">
                    TEAMACTION
                </h1>
                <p className="text-[10px] font-bold text-orange-500 tracking-[0.3em] uppercase bg-slate-900/80 px-4 py-1.5 rounded-full inline-block border border-orange-500/30 shadow-lg backdrop-blur-sm">
                    BY TEAMBATTLE
                </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-5 w-full">
                {/* LETS PLAY */}
                <button 
                  onClick={() => onAction('PLAY')}
                  className="group relative h-28 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-t border-orange-400"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <Play className="w-10 h-10 mb-1 text-white fill-white group-hover:scale-110 transition-transform drop-shadow-sm" />
                        <span className="text-2xl font-black tracking-[0.2em] uppercase text-white leading-none mb-1">LETS PLAY</span>
                        <span className="text-[9px] font-bold text-orange-100/90 tracking-widest bg-black/20 px-3 py-0.5 rounded-full">JOIN MISSION</span>
                    </div>
                </button>

                <div className="flex items-center gap-4 text-slate-600 font-black text-[10px] tracking-widest uppercase my-1">
                    <div className="h-px bg-slate-800 flex-1"></div>OR<div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* LETS CREATE */}
                    <button 
                      onClick={() => onAction('CREATE')}
                      className="group relative h-28 bg-slate-900 hover:bg-slate-800 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-slate-800 hover:border-blue-500/50"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                        <div className="relative z-10 flex flex-col items-center">
                            <Plus className="w-6 h-6 mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-black tracking-widest uppercase text-slate-300 group-hover:text-white">LETS CREATE</span>
                            <span className="text-[8px] font-bold text-slate-600 mt-1 tracking-wider group-hover:text-blue-400">DESIGNER HUB</span>
                        </div>
                    </button>

                    {/* LETS EDIT */}
                    <button 
                      onClick={() => onAction('EDIT')}
                      className="group relative h-28 bg-slate-900 hover:bg-slate-800 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-slate-800 hover:border-amber-500/50"
                    >
                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                        <div className="relative z-10 flex flex-col items-center">
                            <Edit2 className="w-6 h-6 mb-2 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-black tracking-widest uppercase text-slate-300 group-hover:text-white">LETS EDIT</span>
                            <span className="text-[8px] font-bold text-slate-600 mt-1 tracking-wider group-hover:text-amber-400">MAP EDITOR</span>
                        </div>
                    </button>
                </div>
            </div>
            
            <div className="mt-8 opacity-20 text-[8px] font-bold text-slate-500 tracking-[0.3em]">
                V 1.0.1
            </div>
        </div>
    </div>
  );
};

export default InitialLanding;
