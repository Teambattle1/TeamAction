
import React, { useState, useEffect, useRef } from 'react';
import { GameMode, MapStyleId, Language, Playground, TimerConfig, Coordinate } from '../types';
import { Map as MapIcon, Layers, GraduationCap, Menu, X, Globe, Moon, Sun, Library, Users, Home, LayoutDashboard, Ruler, Gamepad2, Shield, Clock, Move, MapPin, Maximize, Target, Hash, MessageSquare, Skull, Siren, AlertTriangle, GripHorizontal, ToggleLeft, ToggleRight, Anchor } from 'lucide-react';
import { formatDistance } from '../utils/geo';
import LocationSearch from './LocationSearch';
import { ICON_COMPONENTS } from '../utils/icons';

interface GameHUDProps {
  accuracy: number | null;
  mode: GameMode;
  toggleMode: () => void;
  onSetMode?: (mode: GameMode) => void; 
  onOpenGameManager: () => void;
  onOpenTaskMaster: () => void;
  onOpenTeams: () => void;
  mapStyle: MapStyleId;
  onSetMapStyle: (style: MapStyleId) => void;
  language: Language;
  onBackToHub: () => void;
  activeGameName?: string;
  onOpenInstructorDashboard?: () => void;
  isMeasuring?: boolean;
  onToggleMeasure?: () => void;
  measuredDistance?: number;
  playgrounds?: Playground[];
  onOpenPlayground?: (id: string) => void;
  onOpenTeamDashboard?: () => void; // This opens the Stats View (TeamDashboard)
  onRelocateGame?: () => void;
  isRelocating?: boolean;
  timerConfig?: TimerConfig; 
  gameStartedAt?: number;
  onFitBounds?: () => void; 
  onLocateMe?: () => void; 
  onSearchLocation?: (coord: Coordinate) => void; 
  isDrawerExpanded?: boolean; 
  showScores?: boolean;
  onToggleScores?: () => void;
  hiddenPlaygroundIds?: string[]; 
  onToggleChat?: () => void; 
  unreadMessagesCount?: number; 
  targetPlaygroundId?: string; 
  onAddDangerZone?: () => void; 
  activeDangerZone?: { id: string; enteredAt: number; timeRemaining: number } | null; 
  showOtherTeams?: boolean;
  onToggleShowOtherTeams?: () => void;
  simulatedOrientation?: 'portrait' | 'landscape'; // New prop
}

// Timer Sub-component
const TimerDisplay = ({ config, startTime }: { config: TimerConfig, startTime?: number }) => {
    const [displayTime, setDisplayTime] = useState("--:--");
    const [statusColor, setStatusColor] = useState("text-white");

    useEffect(() => {
        if (config.mode === 'none') return;

        const updateTimer = () => {
            const now = Date.now();
            let seconds = 0;

            if (config.mode === 'countup') {
                const start = startTime || now; 
                seconds = Math.floor((now - start) / 1000);
            } else if (config.mode === 'countdown') {
                const start = startTime || now;
                const durationSec = (config.durationMinutes || 60) * 60;
                const elapsed = Math.floor((now - start) / 1000);
                seconds = durationSec - elapsed;
            } else if (config.mode === 'scheduled_end') {
                if (config.endTime) {
                    const end = new Date(config.endTime).getTime();
                    seconds = Math.floor((end - now) / 1000);
                }
            }

            if (seconds < 0) {
                if (config.mode === 'countup') seconds = Math.abs(seconds); 
                else seconds = 0; 
            }

            if (config.mode !== 'countup' && seconds < 300) setStatusColor("text-red-500 animate-pulse"); 
            else setStatusColor("text-white");

            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;

            if (h > 0) {
                setDisplayTime(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                setDisplayTime(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [config, startTime]);

    if (config.mode === 'none') return null;

    return (
        <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-1.5 rounded-xl shadow-xl flex flex-col items-center min-w-[100px] z-[500] pointer-events-none">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                {config.title || "TIMER"}
            </span>
            <div className={`text-xl font-mono font-black leading-none flex items-center gap-2 ${statusColor}`}>
                <Clock className="w-4 h-4 opacity-50" />
                {displayTime}
            </div>
        </div>
    );
};

const GameHUD: React.FC<GameHUDProps> = ({ 
  mode, 
  toggleMode,
  onSetMode,
  onOpenGameManager,
  onOpenTaskMaster,
  onOpenTeams,
  mapStyle,
  onSetMapStyle,
  onBackToHub,
  onOpenInstructorDashboard,
  isMeasuring,
  onToggleMeasure,
  measuredDistance,
  playgrounds,
  onOpenPlayground,
  onOpenTeamDashboard,
  onRelocateGame,
  isRelocating,
  timerConfig,
  gameStartedAt,
  onFitBounds,
  onLocateMe,
  onSearchLocation,
  isDrawerExpanded = false,
  showScores,
  onToggleScores,
  hiddenPlaygroundIds = [],
  onToggleChat,
  unreadMessagesCount = 0,
  targetPlaygroundId, 
  onAddDangerZone,
  activeDangerZone,
  showOtherTeams,
  onToggleShowOtherTeams,
  simulatedOrientation
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEditBanner, setShowEditBanner] = useState(false);

  // Floating Toolbar State
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number, y: number, initialX: number, initialY: number } | null>(null);

  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (mode === GameMode.EDIT) {
          setShowEditBanner(true);
          timer = setTimeout(() => {
              setShowEditBanner(false);
          }, 5000);
      } else {
          setShowEditBanner(false);
      }
      return () => clearTimeout(timer);
  }, [mode]);

  const mapStyles: { id: MapStyleId; label: string; icon: any }[] = [
      { id: 'osm', label: 'Standard', icon: MapIcon },
      { id: 'satellite', label: 'Satellite', icon: Globe },
      { id: 'dark', label: 'Dark Mode', icon: Moon },
      { id: 'light', label: 'Light Mode', icon: Sun },
  ];

  const visiblePlaygrounds = playgrounds?.filter(p => {
      if (mode === GameMode.PLAY && hiddenPlaygroundIds.includes(p.id)) return false;
      return p.buttonVisible;
  }) || [];

  const leftMenuPositionClass = (mode === GameMode.EDIT && isDrawerExpanded) ? 'sm:left-[340px]' : 'left-4';
  const searchBarPositionClass = (mode === GameMode.EDIT && isDrawerExpanded) ? 'sm:left-[calc(50%+160px)]' : 'sm:left-1/2 sm:-translate-x-1/2';

  const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          initialX: toolbarPos.x,
          initialY: toolbarPos.y
      };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!dragStartRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setToolbarPos({
          x: dragStartRef.current.initialX + dx,
          y: dragStartRef.current.initialY + dy
      });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (dragStartRef.current) {
          (e.target as Element).releasePointerCapture(e.pointerId);
          dragStartRef.current = null;
      }
  };

  // Switch Mode Handler
  const handleSetMode = (m: GameMode) => {
      if (onSetMode) onSetMode(m);
      else toggleMode(); // Fallback
  };

  if (activeDangerZone && mode === GameMode.PLAY) {
      return (
          <div className="fixed inset-0 z-[9999] bg-red-600 animate-pulse flex flex-col items-center justify-center text-white p-8 text-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-xl p-10 rounded-[3rem] border-8 border-red-500 shadow-[0_0_100px_rgba(255,0,0,0.8)] max-w-lg w-full flex flex-col items-center">
                  <Siren className="w-24 h-24 text-red-500 mb-6 animate-bounce" />
                  <h1 className="text-5xl font-black uppercase tracking-widest mb-2 text-red-500 drop-shadow-lg">WARNING</h1>
                  <h2 className="text-2xl font-black uppercase tracking-widest mb-8">RESTRICTED AREA</h2>
                  
                  {activeDangerZone.timeRemaining > 0 ? (
                      <>
                          <p className="text-sm font-bold uppercase tracking-widest mb-4 text-gray-300">LEAVE IMMEDIATELY OR LOSE POINTS</p>
                          <div className="text-8xl font-black font-mono tabular-nums text-white animate-pulse">
                              {activeDangerZone.timeRemaining}
                          </div>
                          <p className="text-xs font-bold uppercase mt-2 text-red-400">SECONDS REMAINING</p>
                      </>
                  ) : (
                      <>
                          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                          <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-2">DAMAGE TAKEN</h3>
                          <p className="text-xl font-bold text-red-400 uppercase">-500 POINTS</p>
                      </>
                  )}
              </div>
          </div>
      );
  }

  return (
    <>
      {/* TIMER */}
      {timerConfig && mode !== GameMode.EDIT && (
          <TimerDisplay config={timerConfig} startTime={gameStartedAt} />
      )}

      {showEditBanner && !isMeasuring && !isRelocating && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-orange-600/95 text-white px-6 py-3 rounded-full backdrop-blur-md z-[2000] animate-in fade-in slide-in-from-bottom-4 pointer-events-none shadow-xl border border-white/20 flex items-center gap-3 transition-opacity duration-500">
              <div className="bg-white/20 p-1.5 rounded-full animate-pulse"><Layers className="w-4 h-4 text-white" /></div>
              <span className="text-xs font-black uppercase tracking-widest">
                  EDIT MODE &bull; TAP MAP TO PLACE
              </span>
          </div>
      )}

      {isRelocating && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-green-600/95 text-white px-6 py-3 rounded-full backdrop-blur-md z-[2000] animate-in fade-in slide-in-from-bottom-4 pointer-events-none shadow-xl border border-white/20 flex items-center gap-3 transition-opacity duration-500">
              <div className="bg-white/20 p-1.5 rounded-full animate-pulse"><Move className="w-4 h-4 text-white" /></div>
              <span className="text-xs font-black uppercase tracking-widest">
                  RELOCATING &bull; DRAG MAP TO NEW CENTER
              </span>
          </div>
      )}

      {isMeasuring && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-pink-600/95 text-white px-6 py-3 rounded-full backdrop-blur-md z-[2000] animate-in fade-in slide-in-from-bottom-4 pointer-events-none shadow-xl border border-white/20 flex items-center gap-3 transition-opacity duration-500">
              <div className="bg-white/20 p-1.5 rounded-full animate-pulse"><Ruler className="w-4 h-4 text-white" /></div>
              <span className="text-xs font-black uppercase tracking-widest">
                  MEASURING: {formatDistance(measuredDistance || 0)}
              </span>
          </div>
      )}

      {/* PLAYGROUND BUTTONS */}
      {visiblePlaygrounds.length > 0 && (mode === GameMode.PLAY || mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR) && (
          <div className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-4 pointer-events-auto items-end">
              {visiblePlaygrounds.map(pg => {
                  const iconId = pg.iconId || 'default';
                  const Icon = ICON_COMPONENTS[iconId];
                  const isTarget = targetPlaygroundId === pg.id;
                  
                  return (
                      <button
                          key={pg.id}
                          onClick={() => onOpenPlayground && onOpenPlayground(pg.id)}
                          style={{ width: pg.buttonSize || 80, height: pg.buttonSize || 80 }}
                          className={`rounded-3xl flex items-center justify-center transition-all border-4 group relative overflow-hidden shadow-2xl hover:scale-105 active:scale-95 ${pg.iconUrl ? 'bg-white border-white' : 'bg-gradient-to-br from-purple-600 to-indigo-600 border-white/30'} ${isTarget ? 'ring-4 ring-orange-500 animate-pulse' : ''}`}
                      >
                          {pg.iconUrl ? <img src={pg.iconUrl} className="w-full h-full object-cover" alt={pg.title} /> : <Icon className="w-1/2 h-1/2 text-white" />}
                          {pg.buttonLabel && (
                              <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-black uppercase text-white drop-shadow-md truncate px-1">
                                  {pg.buttonLabel}
                              </div>
                          )}
                      </button>
                  );
              })}
          </div>
      )}

      {/* TOP LEFT MENU */}
      <div className={`absolute top-4 ${leftMenuPositionClass} z-[2000] flex gap-2 transition-all duration-300 pointer-events-auto`}>
          <button 
              onClick={onBackToHub} 
              className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl rounded-2xl text-slate-700 dark:text-slate-200 hover:text-orange-500 transition-colors"
              title="Home"
          >
              <Home className="w-6 h-6" />
          </button>
          
          <div className="relative">
              <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className={`p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl rounded-2xl text-slate-700 dark:text-slate-200 hover:text-orange-500 transition-colors ${isMenuOpen ? 'text-orange-500' : ''}`}
              >
                  <Menu className="w-6 h-6" />
              </button>

              {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-2">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-2 tracking-widest">MAP MODE</h3>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                          {mapStyles.map(s => (
                              <button 
                                  key={s.id}
                                  onClick={() => { onSetMapStyle(s.id); setIsMenuOpen(false); }}
                                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${mapStyle === s.id ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-600 dark:text-orange-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}
                              >
                                  <s.icon className="w-5 h-5" />
                                  <span className="text-[9px] font-black uppercase">{s.label}</span>
                              </button>
                          ))}
                      </div>

                      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-2 tracking-widest">ACTIONS</h3>
                      <button onClick={() => { onToggleMeasure?.(); setIsMenuOpen(false); }} className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex items-center gap-3 text-xs font-bold uppercase text-slate-600 dark:text-slate-300 transition-colors">
                          <Ruler className="w-4 h-4 text-pink-500" /> MEASURE DISTANCE
                      </button>
                      <button onClick={() => { onOpenTeamDashboard?.(); setIsMenuOpen(false); }} className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex items-center gap-3 text-xs font-bold uppercase text-slate-600 dark:text-slate-300 transition-colors">
                          <Users className="w-4 h-4 text-blue-500" /> MY TEAM
                      </button>
                      
                      {mode === GameMode.EDIT && (
                          <>
                              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                              <button onClick={() => { onRelocateGame?.(); setIsMenuOpen(false); }} className={`p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex items-center gap-3 text-xs font-bold uppercase text-slate-600 dark:text-slate-300 transition-colors ${isRelocating ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''}`}>
                                  <Move className="w-4 h-4 text-green-500" /> {isRelocating ? 'FINISH RELOCATING' : 'RELOCATE GAME'}
                              </button>
                              <button onClick={() => { onAddDangerZone?.(); setIsMenuOpen(false); }} className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex items-center gap-3 text-xs font-bold uppercase text-slate-600 dark:text-slate-300 transition-colors">
                                  <Skull className="w-4 h-4 text-red-500" /> ADD DANGER ZONE
                              </button>
                          </>
                      )}
                  </div>
              )}
          </div>
      </div>

      {/* TOP SEARCH BAR */}
      <div className={`absolute top-4 ${searchBarPositionClass} z-[2000] pointer-events-none transition-all duration-300 w-full max-w-sm px-4`}>
          <LocationSearch 
              onSelectLocation={(c) => onSearchLocation && onSearchLocation(c)} 
              onLocateMe={onLocateMe}
              onFitBounds={onFitBounds}
              hideSearch={!onSearchLocation}
              labelButtons={mode === GameMode.INSTRUCTOR}
          />
      </div>

      {/* FLOATING ACTION BUTTONS (PLAY MODE) */}
      {mode === GameMode.PLAY && (
          <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-3 pointer-events-auto">
              <button 
                  onClick={onToggleChat}
                  className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative"
              >
                  <MessageSquare className="w-6 h-6" />
                  {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">
                          {unreadMessagesCount}
                      </span>
                  )}
              </button>
              
              {onToggleScores && (
                  <button 
                      onClick={onToggleScores}
                      className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${showScores ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}
                  >
                      <Hash className="w-6 h-6" />
                  </button>
              )}
          </div>
      )}

      {/* FLOATING TOOLBAR (INSTRUCTOR MODE - MOBILE STYLE) */}
      {mode === GameMode.INSTRUCTOR && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[2500] pointer-events-auto">
              <button 
                  onClick={onOpenInstructorDashboard}
                  className="bg-slate-900 border border-slate-700 text-white rounded-3xl px-6 py-3 shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
              >
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                      <span className="block text-[10px] font-black uppercase text-slate-400 leading-none mb-0.5">OPEN MENU</span>
                      <span className="block text-xs font-bold uppercase tracking-widest">INSTRUCTOR</span>
                  </div>
              </button>
          </div>
      )}

      {/* FLOATING TOOLBAR (EDIT MODE) */}
      {mode === GameMode.EDIT && (
          <div 
              className="absolute z-[2500] pointer-events-auto flex flex-col gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700 shadow-2xl touch-none"
              style={{ 
                  left: `calc(100% - 80px + ${toolbarPos.x}px)`, 
                  top: `calc(50% - 150px + ${toolbarPos.y}px)` 
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
          >
              <div className="w-full h-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
                  <GripHorizontal className="w-4 h-4 text-slate-400" />
              </div>
              
              <button onClick={onOpenGameManager} className="w-12 h-12 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Game Settings">
                  <Gamepad2 className="w-6 h-6" />
              </button>
              <button onClick={onOpenTaskMaster} className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Task Library">
                  <Library className="w-6 h-6" />
              </button>
              <button onClick={onOpenTeams} className="w-12 h-12 bg-green-600 hover:bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Teams">
                  <Users className="w-6 h-6" />
              </button>
              {onOpenInstructorDashboard && (
                  <button onClick={onOpenInstructorDashboard} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Instructor View">
                      <Shield className="w-6 h-6" />
                  </button>
              )}
          </div>
      )}
    </>
  );
};

export default GameHUD;
