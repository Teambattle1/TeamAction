
import React, { useState, useRef } from 'react';
import { Playground, GamePoint, Game } from '../types';
import { X, Plus, Upload, Trash2, GripVertical, Image as ImageIcon, Check, MousePointer2 } from 'lucide-react';
import { ICON_COMPONENTS } from '../utils/icons';

interface PlaygroundEditorProps {
  game: Game;
  onUpdateGame: (game: Game) => void;
  onClose: () => void;
  onEditPoint: (point: GamePoint) => void;
  onCreateTask: (playgroundId: string) => void;
}

const PlaygroundEditor: React.FC<PlaygroundEditorProps> = ({ game, onUpdateGame, onClose, onEditPoint, onCreateTask }) => {
  const [activePlaygroundId, setActivePlaygroundId] = useState<string | null>(game.playgrounds?.[0]?.id || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePlayground = game.playgrounds?.find(p => p.id === activePlaygroundId);
  const playgroundPoints = game.points.filter(p => p.playgroundId === activePlaygroundId);

  const handleCreatePlayground = () => {
      const newPlayground: Playground = {
          id: `pg-${Date.now()}`,
          title: 'New Playground',
          buttonVisible: true
      };
      const updatedPlaygrounds = [...(game.playgrounds || []), newPlayground];
      onUpdateGame({ ...game, playgrounds: updatedPlaygrounds });
      setActivePlaygroundId(newPlayground.id);
  };

  const handleDeletePlayground = (id: string) => {
      if (!confirm("Delete this playground? Tasks inside will be removed.")) return;
      
      const updatedPlaygrounds = game.playgrounds?.filter(p => p.id !== id) || [];
      // Remove tasks associated with this playground
      const updatedPoints = game.points.filter(p => p.playgroundId !== id);
      
      onUpdateGame({ ...game, playgrounds: updatedPlaygrounds, points: updatedPoints });
      if (activePlaygroundId === id) setActivePlaygroundId(updatedPlaygrounds[0]?.id || null);
  };

  const handleUpdatePlayground = (updates: Partial<Playground>) => {
      if (!activePlayground) return;
      const updated = (game.playgrounds || []).map(p => p.id === activePlayground.id ? { ...p, ...updates } : p);
      onUpdateGame({ ...game, playgrounds: updated });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activePlayground) {
          setIsUploading(true);
          const reader = new FileReader();
          reader.onloadend = () => {
              handleUpdatePlayground({ imageUrl: reader.result as string });
              setIsUploading(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Allow dropping tasks or creating new ones at click position?
      // For now, simpler: user clicks "Add Task", it appears center, then they drag it.
  };

  const updatePointPosition = (pointId: string, xPercent: number, yPercent: number) => {
      const updatedPoints = game.points.map(p => p.id === pointId ? { ...p, playgroundPosition: { x: xPercent, y: yPercent } } : p);
      onUpdateGame({ ...game, points: updatedPoints });
  };

  // Drag Logic
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent, pointId: string) => {
      setDraggingPointId(pointId);
      e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (draggingPointId && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Convert to percentage
          const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
          const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));
          
          updatePointPosition(draggingPointId, xPercent, yPercent);
      }
  };

  const handleMouseUp = () => {
      setDraggingPointId(null);
  };

  return (
    <div className="fixed inset-0 z-[2200] bg-gray-100 dark:bg-gray-900 flex flex-col animate-in fade-in" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-md z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-black uppercase tracking-widest text-gray-800 dark:text-white">PLAYGROUND MANAGER</h2>
                <div className="flex gap-2">
                    {game.playgrounds?.map(pg => (
                        <button 
                            key={pg.id}
                            onClick={() => setActivePlaygroundId(pg.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 transition-colors ${activePlaygroundId === pg.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600'}`}
                        >
                            {pg.title}
                        </button>
                    ))}
                    <button onClick={handleCreatePlayground} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-green-600 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar Controls */}
            {activePlayground ? (
                <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6 overflow-y-auto z-10">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">TITLE</label>
                        <input 
                            type="text" 
                            value={activePlayground.title} 
                            onChange={(e) => handleUpdatePlayground({ title: e.target.value })}
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-bold"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">BACKGROUND</label>
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {activePlayground.imageUrl ? (
                                <img src={activePlayground.imageUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                    <span className="text-[9px] font-black uppercase">UPLOAD IMAGE</span>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                        <span className="text-xs font-bold uppercase">Show in Game HUD</span>
                        <button 
                            onClick={() => handleUpdatePlayground({ buttonVisible: !activePlayground.buttonVisible })}
                            className={`w-10 h-6 rounded-full p-1 transition-colors ${activePlayground.buttonVisible ? 'bg-green-500' : 'bg-gray-400'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${activePlayground.buttonVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <button 
                        onClick={() => onCreateTask(activePlayground.id)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> ADD TASK
                    </button>

                    <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={() => handleDeletePlayground(activePlayground.id)}
                            className="w-full py-3 border border-red-200 dark:border-red-900 text-red-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            DELETE PLAYGROUND
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Create a Playground to start
                </div>
            )}

            {/* Visual Editor Area */}
            <div className="flex-1 bg-gray-200 dark:bg-gray-950 relative overflow-hidden flex items-center justify-center p-8">
                {activePlayground ? (
                    <div 
                        ref={containerRef}
                        className="relative w-full h-full max-w-5xl bg-white shadow-2xl rounded-lg overflow-hidden bg-center bg-no-repeat bg-contain border border-gray-300 dark:border-gray-700"
                        style={{ 
                            backgroundImage: activePlayground.imageUrl ? `url(${activePlayground.imageUrl})` : 'none',
                            backgroundColor: '#1e293b'
                        }}
                    >
                        {!activePlayground.imageUrl && <div className="absolute inset-0 flex items-center justify-center text-white/20 font-black text-4xl uppercase tracking-[0.2em]">DROP IMAGE HERE</div>}
                        
                        {playgroundPoints.map(point => {
                            const Icon = ICON_COMPONENTS[point.iconId];
                            const x = point.playgroundPosition?.x || 50;
                            const y = point.playgroundPosition?.y || 50;
                            
                            return (
                                <div
                                    key={point.id}
                                    onMouseDown={(e) => handleDragStart(e, point.id)}
                                    onClick={(e) => { e.stopPropagation(); onEditPoint(point); }}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group hover:z-50"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                >
                                    <div className="w-12 h-12 bg-white rounded-full shadow-xl border-4 border-orange-500 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        {point.title}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    </div>
  );
};

export default PlaygroundEditor;
