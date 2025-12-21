
import React from 'react';
import { GamePoint, Playground, GameMode } from '../types';
import { ICON_COMPONENTS } from '../utils/icons';
import { X, CheckCircle, Lock } from 'lucide-react';

interface PlaygroundModalProps {
  playground: Playground;
  points: GamePoint[];
  onClose: () => void;
  onPointClick: (point: GamePoint) => void;
  mode: GameMode;
}

const PlaygroundModal: React.FC<PlaygroundModalProps> = ({ playground, points, onClose, onPointClick, mode }) => {
  // Filter points belonging to this playground
  const playgroundPoints = points.filter(p => p.playgroundId === playground.id);

  return (
    <div className="fixed inset-0 z-[1500] bg-black text-white flex flex-col animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="p-4 bg-black/60 backdrop-blur-md absolute top-0 left-0 right-0 z-20 flex justify-between items-center border-b border-white/10">
          <div>
              <h2 className="text-xl font-black uppercase tracking-widest text-white shadow-sm">{playground.title}</h2>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wide">VIRTUAL PLAYGROUND</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
              <X className="w-6 h-6 text-white" />
          </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">
          {/* Background Image */}
          {playground.imageUrl ? (
              <div 
                className="absolute inset-0 bg-center bg-no-repeat bg-contain" // Changed to contain to see full image
                style={{ backgroundImage: `url(${playground.imageUrl})` }}
              />
          ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-black uppercase tracking-widest text-2xl">
                  NO BACKGROUND IMAGE
              </div>
          )}

          {/* Points */}
          {playgroundPoints.map(point => {
              const Icon = ICON_COMPONENTS[point.iconId] || ICON_COMPONENTS.default;
              const isUnlocked = point.isUnlocked || mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR;
              const isCompleted = point.isCompleted;
              
              const x = point.playgroundPosition?.x || 50;
              const y = point.playgroundPosition?.y || 50;

              return (
                  <button
                      key={point.id}
                      onClick={() => onPointClick(point)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group flex flex-col items-center ${isUnlocked ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-50 grayscale'}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                  >
                      {/* Icon Bubble */}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 relative ${
                          isCompleted ? 'bg-green-500 border-green-300' : 
                          isUnlocked ? 'bg-white border-orange-500' : 'bg-slate-700 border-slate-500'
                      }`}>
                          {isCompleted ? (
                              <CheckCircle className="w-8 h-8 text-white" />
                          ) : !isUnlocked ? (
                              <Lock className="w-6 h-6 text-slate-400" />
                          ) : (
                              <Icon className="w-8 h-8 text-orange-600" />
                          )}
                          
                          {/* Logic Badge */}
                          {mode === GameMode.EDIT && (point.logic?.onOpen?.length || point.logic?.onCorrect?.length) && (
                              <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                          )}
                      </div>

                      {/* Title Label */}
                      <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shadow-lg whitespace-nowrap max-w-[150px] truncate ${
                          isCompleted ? 'bg-green-600 text-white' : 
                          isUnlocked ? 'bg-white text-slate-900 border-2 border-orange-500' : 'bg-slate-800 text-slate-400'
                      }`}>
                          {point.title}
                      </div>
                  </button>
              );
          })}
      </div>
    </div>
  );
};

export default PlaygroundModal;
