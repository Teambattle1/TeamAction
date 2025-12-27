
import React, { useState, useEffect, useRef } from 'react';
import { GameMode, MapStyleId, Language, Coordinate, TimerConfig, Playground, GameRoute } from '../types';
import { 
    Map as MapIcon, Layers, Crosshair, ChevronLeft, Ruler, Settings, 
    MessageSquare, Shield, Globe, Skull, Clock,
    Route as RouteIcon, Eye, EyeOff, Snowflake, GripHorizontal, Mountain, Sun, Navigation, Upload, Users,
    MapPin
} from 'lucide-react';
import LocationSearch from './LocationSearch';
import { ICON_COMPONENTS } from '../utils/icons';
import { parseGPX } from '../utils/gpx';

interface GameHUDProps {
    accuracy: number | null;
    mode: GameMode;
    toggleMode: () => void;
    onSetMode: (mode: GameMode) => void;
    onOpenGameManager: () => void;
    onOpenTaskMaster: () => void;
    onOpenTeams: () => void;
    mapStyle: MapStyleId;
    onSetMapStyle: (style: MapStyleId) => void;
    language: Language;
    onBackToHub: () => void;
    activeGameName?: string;
    onOpenInstructorDashboard: () => void;
    isMeasuring: boolean;
    onToggleMeasure: () => void;
    measuredDistance: number;
    measurePointsCount?: number; 
    playgrounds?: Playground[];
    onOpenPlayground: (id: string) => void;
    onOpenTeamDashboard: () => void;
    onRelocateGame: () => void;
    isRelocating: boolean;
    timerConfig?: TimerConfig;
    onFitBounds: () => void;
    onLocateMe: () => void;
    onSearchLocation: (coord: Coordinate) => void;
    isDrawerExpanded: boolean;
    showScores: boolean;
    onToggleScores: () => void;
    hiddenPlaygroundIds: string[];
    onToggleChat: () => void;
    unreadMessagesCount: number;
    targetPlaygroundId?: string;
    onAddDangerZone: () => void;
    activeDangerZone: any;
    onEditGameSettings: () => void;
    onOpenGameChooser: () => void;
    // Route Props
    routes?: GameRoute[];
    onToggleRoute?: (id: string) => void;
    onAddRoute?: (route: GameRoute) => void;
}

const MAP_STYLES_LIST: { id: MapStyleId; label: string; icon: any }[] = [
    { id: 'osm', label: 'Standard', icon: Globe },
    { id: 'ski', label: 'Ski Map', icon: Snowflake },
    { id: 'winter', label: 'Winter', icon: Mountain },
    { id: 'satellite', label: 'Satellite', icon: Layers },
    { id: 'dark', label: 'Dark Mode', icon: MapIcon },
    { id: 'light', label: 'Light Mode', icon: Sun },
    { id: 'voyager', label: 'Voyager', icon: Navigation },
    { id: 'clean', label: 'Clean', icon: MapIcon },
];

const GameHUD: React.FC<GameHUDProps> = ({
    accuracy, mode, toggleMode, onSetMode, onOpenGameManager, onOpenTaskMaster, onOpenTeams,
    mapStyle, onSetMapStyle, language, onBackToHub, activeGameName, onOpenInstructorDashboard,
    isMeasuring, onToggleMeasure, measuredDistance, measurePointsCount = 0, playgrounds, onOpenPlayground, onOpenTeamDashboard,
    onRelocateGame, isRelocating, timerConfig, onFitBounds, onLocateMe, onSearchLocation,
    isDrawerExpanded, showScores, onToggleScores, hiddenPlaygroundIds, onToggleChat, unreadMessagesCount,
    targetPlaygroundId, onAddDangerZone, activeDangerZone, onEditGameSettings, onOpenGameChooser,
    routes, onToggleRoute, onAddRoute
}) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [timerAlert, setTimerAlert] = useState(false);
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [showRouteMenu, setShowRouteMenu] = useState(false);

    // Draggable Toolbox State
    const [toolboxPos, setToolboxPos] = useState({ x: window.innerWidth - 140, y: 100 });
    const [isDraggingBox, setIsDraggingBox] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    
    // Draggable Measure Box State
    const [measureBoxPos, setMeasureBoxPos] = useState({ x: window.innerWidth / 2 - 80, y: 120 });
    const [isDraggingMeasure, setIsDraggingMeasure] = useState(false);
    const measureDragOffset = useRef({ x: 0, y: 0 });

    const gpxInputRef = useRef<HTMLInputElement>(null);

    // Ensure toolbox stays on screen on resize
    useEffect(() => {
        const handleResize = () => {
            setToolboxPos(prev => ({
                x: Math.min(Math.max(0, prev.x), window.innerWidth - 140),
                y: Math.min(Math.max(0, prev.y), window.innerHeight - 200)
            }));
            setMeasureBoxPos(prev => ({
                x: Math.min(Math.max(0, prev.x), window.innerWidth - 200),
                y: Math.min(Math.max(0, prev.y), window.innerHeight - 150)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Toolbox Drag Handlers
    const handleBoxPointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingBox(true);
        dragOffset.current = { x: e.clientX - toolboxPos.x, y: e.clientY - toolboxPos.y };
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
    };

    const handleBoxPointerMove = (e: React.PointerEvent) => {
        if (!isDraggingBox) return;
        e.stopPropagation();
        e.preventDefault();
        setToolboxPos({ 
            x: e.clientX - dragOffset.current.x, 
            y: e.clientY - dragOffset.current.y 
        });
    };

    const handleBoxPointerUp = (e: React.PointerEvent) => {
        setIsDraggingBox(false);
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    };

    // Measure Box Drag Handlers
    const handleMeasurePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingMeasure(true);
        measureDragOffset.current = { x: e.clientX - measureBoxPos.x, y: e.clientY - measureBoxPos.y };
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
    };

    const handleMeasurePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingMeasure) return;
        e.stopPropagation();
        e.preventDefault();
        setMeasureBoxPos({ 
            x: e.clientX - measureDragOffset.current.x, 
            y: e.clientY - measureDragOffset.current.y 
        });
    };

    const handleMeasurePointerUp = (e: React.PointerEvent) => {
        setIsDraggingMeasure(false);
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    };

    const handleGPXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onAddRoute) return;

        try {
            const coords = await parseGPX(file);
            const newRoute: GameRoute = {
                id: `rt-${Date.now()}`,
                name: file.name.replace('.gpx', ''),
                color: '#ef4444', 
                points: coords,
                isVisible: true
            };
            onAddRoute(newRoute);
            onFitBounds(); 
            setShowLayerMenu(false); 
        } catch (err) {
            alert('Failed to load GPX: ' + err);
        }
        e.target.value = '';
    };

    useEffect(() => {
        if (!timerConfig || timerConfig.mode === 'none') {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            let target: Date | null = null;

            if (timerConfig.mode === 'scheduled_end' && timerConfig.endTime) {
                target = new Date(timerConfig.endTime);
            }
            
            if (target) {
                const diff = target.getTime() - now.getTime();
                if (diff <= 0) {
                    setTimeLeft('00:00:00');
                    setTimerAlert(true);
                } else {
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                    if (diff < 300000) setTimerAlert(true);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timerConfig]);

    const renderGameNameButton = () => (
        activeGameName && (
            <button 
                onClick={onOpenGameChooser}
                className="bg-black/80 backdrop-blur-md h-12 px-5 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3 cursor-pointer hover:bg-black/90 transition-colors group pointer-events-auto"
                title="Switch Game Session"
            >
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                <p className="text-[10px] text-white font-black uppercase tracking-widest leading-none max-w-[200px] truncate group-hover:text-orange-400 transition-colors">{activeGameName}</p>
            </button>
        )
    );

    const renderLayerMenu = () => (
        <div className="absolute right-full top-0 mr-3 bg-slate-900 border border-slate-700 rounded-xl p-2 min-w-[160px] shadow-xl animate-in slide-in-from-right-2 max-h-[60vh] overflow-y-auto custom-scrollbar pointer-events-auto z-[3000]">
            <div className="mb-2 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">MAP STYLE</div>
            {MAP_STYLES_LIST.map((style) => (
                <button
                    key={style.id}
                    onClick={(e) => { e.stopPropagation(); onSetMapStyle(style.id); setShowLayerMenu(false); }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold uppercase mb-1 last:mb-0 transition-colors ${mapStyle === style.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                >
                    <style.icon className="w-4 h-4" /> {style.label}
                </button>
            ))}
            
            {mode === GameMode.EDIT && onAddRoute && (
                <>
                    <div className="my-2 h-px bg-slate-800 w-full" />
                    <div className="mb-2 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">OVERLAYS</div>
                    <button
                        onClick={(e) => { e.stopPropagation(); gpxInputRef.current?.click(); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-800 text-blue-400 transition-colors"
                    >
                        <Upload className="w-4 h-4" /> UPLOAD GPX
                    </button>
                    <input ref={gpxInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGPXUpload} />
                </>
            )}
        </div>
    );

    // Calculate sidebar offset
    const sidebarOffset = (mode === GameMode.EDIT && isDrawerExpanded) ? 'sm:translate-x-[320px]' : '';

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-[1000]">
            
            {/* TOP BAR */}
            <div className="flex justify-between items-start pointer-events-none">
                
                {/* Left: Hub & Game Name - Shift when Drawer Open */}
                <div className={`flex items-start gap-2 pointer-events-auto transition-transform duration-300 ease-in-out ${sidebarOffset}`}>
                    <button onClick={onBackToHub} className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:scale-105 transition-transform">
                        <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                    </button>
                    
                    {mode === GameMode.EDIT && renderGameNameButton()}
                </div>

                {/* Center: Search & (In Play Mode: Game Name, Timer) - Shift when Drawer Open */}
                <div className={`flex flex-col items-center gap-2 pointer-events-auto transition-transform duration-300 ease-in-out ${sidebarOffset}`}>
                    
                    <LocationSearch 
                        onSelectLocation={onSearchLocation} 
                        onLocateMe={onLocateMe}
                        onFitBounds={onFitBounds}
                        hideSearch={window.innerWidth < 640 && mode !== GameMode.EDIT} 
                        onToggleScores={onToggleScores}
                        showScores={showScores}
                        className="shadow-xl"
                    />

                    {mode !== GameMode.EDIT && renderGameNameButton()}

                    {timeLeft && (
                        <div className={`px-4 py-2 rounded-xl backdrop-blur-md font-mono font-bold text-lg shadow-lg flex items-center gap-2 border ${timerAlert ? 'bg-red-600/90 border-red-500 animate-pulse text-white' : 'bg-black/60 border-white/10 text-white'}`}>
                            <Clock className="w-4 h-4" />
                            {timeLeft}
                        </div>
                    )}

                    {activeDangerZone && (
                        <div className="bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg animate-bounce flex items-center gap-2 border-2 border-red-400">
                            <Skull className="w-5 h-5" />
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[10px] font-black uppercase tracking-widest">DANGER ZONE</span>
                                <span className="text-sm font-bold font-mono">{activeDangerZone.timeRemaining}s</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Tools & Chat - Stay Fixed */}
                <div className="flex flex-col gap-2 pointer-events-auto items-end">
                    <button 
                        onClick={onToggleChat}
                        className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:scale-105 transition-transform relative"
                    >
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        {unreadMessagesCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                {unreadMessagesCount}
                            </span>
                        )}
                    </button>

                    {mode === GameMode.EDIT && (
                        <button 
                            onClick={onEditGameSettings}
                            className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:scale-105 transition-transform text-slate-700 dark:text-slate-200"
                            title="Game Settings"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                    )}

                    {mode === GameMode.INSTRUCTOR && (
                        <button 
                            onClick={onOpenInstructorDashboard}
                            className="w-12 h-12 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center border border-indigo-400 hover:scale-105 transition-transform text-white"
                            title="Instructor Dashboard"
                        >
                            <Shield className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* DRAGGABLE TOOLBOX (Edit Mode Only) */}
            {mode === GameMode.EDIT && (
                <div 
                    className="absolute z-[1100] pointer-events-auto touch-none"
                    style={{ left: toolboxPos.x, top: toolboxPos.y }}
                    onPointerDown={handleBoxPointerDown}
                    onPointerMove={handleBoxPointerMove}
                    onPointerUp={handleBoxPointerUp}
                >
                    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-2 cursor-move group relative w-[120px]">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-full px-2 border border-slate-700 pointer-events-none">
                            <GripHorizontal className="w-4 h-4" />
                        </div>

                        {showLayerMenu && renderLayerMenu()}

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleMeasure(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border hover:scale-105 transition-transform ${isMeasuring ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                                title="Measure Tool"
                            >
                                <Ruler className="w-6 h-6" />
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAddDangerZone(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-red-900/50 bg-slate-800 text-red-500 hover:bg-red-900/20 hover:text-red-400 hover:scale-105 transition-all"
                                title="Add Danger Zone"
                            >
                                <Skull className="w-6 h-6" />
                            </button>

                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowLayerMenu(!showLayerMenu); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border hover:scale-105 transition-transform ${showLayerMenu ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                                title="Map Layers & Overlays"
                            >
                                <Layers className="w-6 h-6" />
                            </button>

                            <button 
                                onClick={(e) => { e.stopPropagation(); onRelocateGame(); }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border hover:scale-105 transition-transform ${isRelocating ? 'bg-green-600 border-green-400 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                                title="Relocate Game Tasks"
                            >
                                <Crosshair className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DRAGGABLE MEASURE INFO POPUP */}
            {isMeasuring && (
                <div
                    className="absolute z-[1100] cursor-move touch-none pointer-events-auto"
                    style={{ left: measureBoxPos.x, top: measureBoxPos.y }}
                    onPointerDown={handleMeasurePointerDown}
                    onPointerMove={handleMeasurePointerMove}
                    onPointerUp={handleMeasurePointerUp}
                >
                    <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-white/20 flex flex-col items-center gap-1 min-w-[160px] animate-in fade-in zoom-in-95">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1">
                            <Ruler className="w-3 h-3" /> MEASUREMENT
                        </span>
                        <div className="text-3xl font-black">{Math.round(measuredDistance)}m</div>
                        <div className="h-px w-full bg-white/20 my-1"/>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                            <MapPin className="w-4 h-4" /> {measurePointsCount} TASKS ON LINE
                        </div>
                    </div>
                </div>
            )}

            {/* BOTTOM BAR (Play/Instructor Mode Only for Layers) */}
            <div className="flex justify-between items-end pointer-events-none">
                <div className="pointer-events-auto flex flex-col gap-2">
                    {mode !== GameMode.EDIT && (
                        <div className="relative">
                            {showLayerMenu && (
                                <div className="absolute bottom-14 left-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-2 min-w-[140px] animate-in slide-in-from-bottom-2 max-h-[60vh] overflow-y-auto">
                                    {MAP_STYLES_LIST.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => { onSetMapStyle(style.id); setShowLayerMenu(false); }}
                                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-bold uppercase mb-1 last:mb-0 transition-colors ${mapStyle === style.id ? 'bg-orange-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            <style.icon className="w-4 h-4" /> {style.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button 
                                onClick={() => { setShowLayerMenu(!showLayerMenu); setShowRouteMenu(false); }}
                                className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:scale-105 transition-transform"
                                title="Switch Map Layer"
                            >
                                <Layers className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                            </button>
                        </div>
                    )}

                    {routes && routes.length > 0 && (
                        <div className="relative">
                            {showRouteMenu && (
                                <div className="absolute bottom-14 left-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-2 min-w-[160px] animate-in slide-in-from-bottom-2">
                                    <div className="px-2 pb-2 mb-2 border-b border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500">
                                        Active Routes
                                    </div>
                                    {routes.map((route) => (
                                        <button
                                            key={route.id}
                                            onClick={() => onToggleRoute && onToggleRoute(route.id)}
                                            className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold uppercase mb-1 last:mb-0 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: route.color }}></div>
                                                <span className="truncate max-w-[100px]">{route.name}</span>
                                            </div>
                                            {route.isVisible ? <Eye className="w-3 h-3 text-blue-500" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button 
                                onClick={() => { setShowRouteMenu(!showRouteMenu); setShowLayerMenu(false); }}
                                className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-700 hover:scale-105 transition-transform"
                                title="Toggle Routes"
                            >
                                <RouteIcon className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 items-end pointer-events-auto max-w-[60vw] overflow-x-auto pb-2 no-scrollbar px-2">
                    {playgrounds?.filter(p => !hiddenPlaygroundIds.includes(p.id) && p.buttonVisible).map(pg => {
                        const Icon = ICON_COMPONENTS[pg.iconId || 'default'];
                        const isTarget = targetPlaygroundId === pg.id;
                        return (
                            <button
                                key={pg.id}
                                onClick={() => onOpenPlayground(pg.id)}
                                style={{ width: pg.buttonSize || 80, height: pg.buttonSize || 80 }}
                                className={`rounded-3xl flex items-center justify-center transition-all border-4 group relative overflow-hidden shadow-2xl hover:scale-105 active:scale-95 ${pg.iconUrl ? 'bg-white border-white' : 'bg-gradient-to-br from-purple-600 to-indigo-600 border-white/30'} ${isTarget ? 'ring-4 ring-orange-500 ring-offset-4 ring-offset-black animate-pulse' : ''}`}
                            >
                                {pg.iconUrl ? <img src={pg.iconUrl} className="w-full h-full object-cover" alt={pg.title} /> : <Icon className="w-1/2 h-1/2 text-white" />}
                                {isTarget && <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full shadow-md" />}
                            </button>
                        );
                    })}
                </div>

                <div className="pointer-events-auto">
                    {mode === GameMode.PLAY && (
                        <button 
                            onClick={onOpenTeamDashboard}
                            className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-xl flex items-center justify-center border-2 border-orange-400 hover:scale-105 transition-transform"
                        >
                            <Users className="w-8 h-8 text-white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameHUD;
