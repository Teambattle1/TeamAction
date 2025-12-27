
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, Polyline, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GamePoint, Coordinate, GameMode, MapStyleId, Team, DangerZone, TeamStatus, GameRoute, MapConfiguration } from '../types';
import { getLeafletIcon } from '../utils/icons';
import { Trash2, Crosshair, EyeOff, Image as ImageIcon, CheckCircle, HelpCircle, Zap, AlertTriangle, Lock, Users, Trophy, MessageSquare, MapPin } from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';

const UserIcon = L.divIcon({
  className: 'custom-user-icon',
  html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// ... (Team Icon helpers remain unchanged) ...
const getTeamColor = (teamName: string) => {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
};

const createTeamIcon = (teamName: string, photoUrl?: string, status?: TeamStatus) => {
    const color = getTeamColor(teamName);
    let statusHtml = '';
    if (status) {
        let statusColor = '#ef4444'; // Red (Idle)
        let animation = '';
        if (status === 'solving') statusColor = '#eab308'; // Yellow
        else if (status === 'moving') {
            statusColor = '#22c55e'; // Green
            animation = 'animation: pulse 1.5s infinite;';
        }
        statusHtml = `<div style="position: absolute; top: -5px; right: -5px; width: 16px; height: 16px; background-color: ${statusColor}; border: 2px solid white; border-radius: 50%; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.3); ${animation}"></div>`;
    }
    const pinHtml = `
      <div style="position: relative; width: 60px; height: 60px; display: flex; flex-col; align-items: center; justify-content: center;">
        <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 900; white-space: nowrap; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); z-index: 20;">${teamName}</div>
        <div style="position: absolute; bottom: 0; width: 30px; height: 10px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(4px); transform: translateY(5px);"></div>
        <div style="width: 50px; height: 50px; background: white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 2px 2px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; border: 2px solid white;">
          <div style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; transform: rotate(45deg); background-color: ${color}; display: flex; align-items: center; justify-content: center; position: relative;">
            ${photoUrl ? `<img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<div style="font-weight: 900; font-size: 16px; color: white; text-transform: uppercase;">${teamName.substring(0, 2)}</div>`}
          </div>
        </div>
        ${statusHtml}
      </div>
      <style>@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }</style>
    `;
    return L.divIcon({ className: 'custom-team-pin', html: pinHtml, iconSize: [60, 60], iconAnchor: [30, 56], popupAnchor: [0, -60] });
};

const createTeammateIcon = (memberName: string) => {
    return L.divIcon({
        className: 'custom-teammate-icon',
        html: `<div style="width: 30px; height: 30px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${memberName.substring(0, 1)}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

export interface GameMapHandle {
  fitBounds: (points: GamePoint[] | Coordinate[]) => void;
  getBounds: () => { ne: Coordinate; sw: Coordinate } | null;
  getCenter: () => Coordinate;
  jumpTo: (coord: Coordinate, zoom?: number) => void;
}

interface GameMapProps {
  userLocation?: Coordinate | null;
  points: GamePoint[];
  teams?: { team: Team, location: Coordinate, status?: TeamStatus, stats?: any }[];
  teamTrails?: Record<string, Coordinate[]>;
  pointLabels?: Record<string, string>;
  measurePath?: Coordinate[];
  logicLinks?: any[];
  playgroundMarkers?: any[];
  dangerZones?: DangerZone[];
  routes?: GameRoute[];
  dependentPointIds?: string[];
  accuracy?: number | null; 
  mode: GameMode;
  mapStyle: MapStyleId;
  selectedPointId?: string | null;
  isRelocating?: boolean;
  onPointClick: (point: GamePoint) => void;
  onTeamClick?: (teamId: string) => void;
  onMapClick?: (coord: Coordinate) => void;
  onPointMove?: (pointId: string, newLoc: Coordinate) => void;
  onDeletePoint?: (pointId: string) => void;
  onPointHover?: (point: GamePoint | null) => void;
  showScores?: boolean;
  onZoneClick?: (zone: DangerZone) => void;
  gameEnded?: boolean; 
  returnPath?: Coordinate[]; 
  showUserLocation?: boolean; 
  mapConfig?: MapConfiguration; // New Config Prop
  showTrack?: boolean; // New Config Prop
}

// Internal component to handle user location updates
const UserLocationMarker = ({ overrideLocation, overrideAccuracy, visible = true }: { overrideLocation?: Coordinate | null, overrideAccuracy?: number | null, visible?: boolean }) => {
    const { userLocation: ctxLocation, gpsAccuracy: ctxAccuracy } = useLocation();
    
    // Prefer props (for testing/instructor mode), fall back to context
    const location = overrideLocation || ctxLocation;
    const accuracy = overrideAccuracy || ctxAccuracy;

    if (!visible || !location) return null;

    return (
        <>
            <Marker position={[location.lat, location.lng]} icon={UserIcon} zIndexOffset={500} />
            {accuracy !== null && (
                <Circle 
                    center={[location.lat, location.lng]} 
                    radius={accuracy} 
                    pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1, dashArray: '5, 5', interactive: false }} 
                />
            )}
        </>
    );
};

// ... (Rest of components: MapClickParams, RecenterMap, MapController, MapLayers same as before) ...
const MapClickParams = ({ onClick }: { onClick?: (c: Coordinate) => void }) => {
  useMapEvents({ click(e) { if (onClick) onClick(e.latlng); } });
  return null;
};

const RecenterMap = ({ center, points, mode }: { center: Coordinate | null, points: GamePoint[], mode: GameMode }) => {
  const map = useMap();
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && (mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR) && points.length > 0) {
        const validPoints = points.filter(p => p.location.lat !== 0 || p.location.lng !== 0);
        if (validPoints.length > 0) {
            const latLngs = validPoints.map(p => [p.location.lat, p.location.lng] as [number, number]);
            const bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], animate: false, maxZoom: 16 });
                initializedRef.current = true;
                return;
            }
        }
    }
    if (!initializedRef.current && center) {
      map.setView([center.lat, center.lng], 16);
      initializedRef.current = true;
    }
  }, [center, points, mode, map]);
  return null;
};

const MapController = ({ handleRef }: { handleRef: React.RefObject<any> }) => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
        const t = setTimeout(() => map.invalidateSize(), 200);
        return () => clearTimeout(t);
    }, [map]);
    useImperativeHandle(handleRef, () => ({
        fitBounds: (pts: GamePoint[] | Coordinate[]) => {
            let latLngs: L.LatLngExpression[] = [];
            if (pts.length > 0 && 'location' in pts[0]) {
                 const validPts = (pts as GamePoint[]).filter(p => p.location.lat !== 0 || p.location.lng !== 0);
                 latLngs = validPts.map(p => [p.location.lat, p.location.lng]);
            } else {
                 latLngs = (pts as Coordinate[]).map(c => [c.lat, c.lng]);
            }
            if (latLngs.length === 0) return;
            const bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        },
        getBounds: () => {
            const b = map.getBounds();
            return { ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng }, sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng } };
        },
        getCenter: () => { const c = map.getCenter(); return { lat: c.lat, lng: c.lng }; },
        jumpTo: (coord: Coordinate, zoom: number = 17) => { map.flyTo([coord.lat, coord.lng], zoom, { duration: 1.5 }); }
    }));
    return null;
};

const MAP_LAYERS: Record<string, { url: string; attribution: string, className?: string }> = {
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CartoDB' },
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CartoDB' },
  ancient: { url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', attribution: '&copy; Stamen Design' },
  clean: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attribution: '&copy; CartoDB' },
  voyager: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', attribution: '&copy; CartoDB' },
  winter: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', className: 'map-filter-winter' },
  ski: { url: 'https://tiles.openskimap.org/map/{z}/{x}/{y}.png', attribution: '&copy; OpenSkiMap' },
  historic: { url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap', className: 'map-filter-historic' },
  google_custom: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CartoDB' }
};

const MapLayers: React.FC<{ mapStyle: string }> = React.memo(({ mapStyle }) => {
  if (mapStyle === 'none') {
      return null; 
  }
  const layer = MAP_LAYERS[mapStyle] || MAP_LAYERS.osm;
  return (
    <>
      <TileLayer url={layer.url} attribution={layer.attribution} className={layer.className || ''} />
      {mapStyle === 'historic' && (
          <>
            <style>{`.map-filter-historic { filter: sepia(0.6) contrast(1.1) brightness(0.9) hue-rotate(-15deg) !important; }`}</style>
            <div className="absolute inset-0 z-[5] pointer-events-none opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
          </>
      )}
      {mapStyle === 'winter' && <style>{`.map-filter-winter { filter: brightness(1.2) hue-rotate(180deg) saturate(0.5) !important; }`}</style>}
    </>
  );
});

// Task Marker Component
const MapTaskMarker = React.memo(({ point, mode, label, showScore, onClick, onMove, onDelete, mapConfig }: any) => {
    const isUnlocked = point.isUnlocked || mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR;
    const isCompleted = point.isCompleted;
    const draggable = mode === GameMode.EDIT;
    
    // Config Logic for Pin Labels
    let displayLabel = label;
    let displayScore = showScore;

    if (mode === GameMode.PLAY) {
        const displayMode = mapConfig?.pinDisplayMode || 'order'; // Default to order if not set
        if (displayMode === 'score') {
            displayScore = true;
            displayLabel = undefined; // Don't show order if score selected
        } else if (displayMode === 'none') {
            displayLabel = undefined;
            displayScore = false;
        } else {
            // 'order' or default
            // Label is already passed as index+1 from parent for PLAY mode logic below
        }
    }

    const eventHandlers = React.useMemo(
        () => ({
            click: () => onClick(point),
            dragend(e: any) {
                if (onMove) onMove(point.id, e.target.getLatLng());
            },
        }),
        [point, onClick, onMove]
    );

    const icon = getLeafletIcon(
        point.iconId, 
        isUnlocked, 
        isCompleted, 
        displayLabel, 
        (point.logic?.onOpen?.length || point.logic?.onCorrect?.length || point.logic?.onIncorrect?.length) && mode === GameMode.EDIT,
        point.areaColor, 
        mode === GameMode.EDIT && point.isHiddenBeforeScan,
        displayScore ? point.points : undefined,
        point.iconUrl
    );

    const showIntro = mapConfig?.showShortIntroUnderPin && point.shortIntro && (isUnlocked || mode === GameMode.EDIT);

    return (
        <React.Fragment>
            <Marker 
                position={[point.location.lat, point.location.lng]} 
                icon={icon} 
                eventHandlers={eventHandlers}
                draggable={draggable}
                zIndexOffset={isCompleted ? 0 : 100}
            >
                {/* Short Intro Tooltip */}
                {showIntro && (
                    <Tooltip direction="bottom" offset={[0, 20]} opacity={0.9} permanent className="custom-leaflet-tooltip font-bold text-xs uppercase bg-black text-white px-2 py-1 rounded shadow-lg border border-white/20">
                        {point.shortIntro}
                    </Tooltip>
                )}

                {mode === GameMode.EDIT && (
                    <Popup>
                        <div className="flex flex-col gap-2">
                            <span className="font-bold">{point.title}</span>
                            <button onClick={() => onDelete(point.id)} className="text-red-500 text-xs font-bold uppercase flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </Popup>
                )}
            </Marker>
            
            {(mode === GameMode.EDIT || isUnlocked) && (
                <Circle 
                    center={[point.location.lat, point.location.lng]} 
                    radius={point.radiusMeters}
                    pathOptions={{ 
                        color: isCompleted ? '#22c55e' : (point.areaColor || (isUnlocked ? '#eab308' : '#3b82f6')), 
                        fillColor: isCompleted ? '#22c55e' : (point.areaColor || (isUnlocked ? '#eab308' : '#3b82f6')), 
                        fillOpacity: 0.1, 
                        weight: 1,
                        dashArray: isCompleted ? undefined : '5, 10'
                    }} 
                    interactive={false}
                />
            )}
        </React.Fragment>
    );
}, (prev, next) => {
    return prev.point.id === next.point.id && 
           prev.point.location.lat === next.point.location.lat && 
           prev.point.location.lng === next.point.location.lng &&
           prev.point.isUnlocked === next.point.isUnlocked &&
           prev.point.isCompleted === next.point.isCompleted &&
           prev.mode === next.mode &&
           prev.showScore === next.showScore &&
           prev.point.isHiddenBeforeScan === next.point.isHiddenBeforeScan &&
           prev.mapConfig?.showShortIntroUnderPin === next.mapConfig?.showShortIntroUnderPin && // Check config change
           prev.mapConfig?.pinDisplayMode === next.mapConfig?.pinDisplayMode;
});

const DangerZoneMarker = React.memo(({ zone, onClick, mode }: any) => {
    return (
        <Circle
            center={[zone.location.lat, zone.location.lng]}
            radius={zone.radius}
            pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '10, 10',
                className: 'animate-pulse-slow' 
            }}
            eventHandlers={{ click: () => mode === GameMode.EDIT && onClick && onClick(zone) }}
        >
            {mode === GameMode.EDIT && <Tooltip permanent direction="center" className="custom-leaflet-tooltip font-bold text-red-500">{zone.title || 'DANGER'}</Tooltip>}
        </Circle>
    );
});

// WRAP GAME MAP IN MEMO TO PREVENT RE-RENDERS
const GameMap = React.memo(forwardRef<GameMapHandle, GameMapProps>(({ 
    userLocation: propLocation, 
    points = [], 
    teams = [], 
    teamTrails = {}, 
    pointLabels = {}, 
    measurePath = [], 
    logicLinks = [], 
    playgroundMarkers = [], 
    dangerZones = [], 
    routes = [],
    dependentPointIds = [], 
    accuracy: propAccuracy, 
    mode, 
    mapStyle, 
    selectedPointId, 
    isRelocating, 
    onPointClick, 
    onTeamClick, 
    onMapClick, 
    onPointMove, 
    onDeletePoint, 
    onPointHover, 
    showScores, 
    onZoneClick,
    gameEnded = false, 
    returnPath,
    showUserLocation = true,
    mapConfig, // New Prop
    showTrack
}, ref) => {
  const center = propLocation || { lat: 55.6761, lng: 12.5683 };
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null);
  
  // Track User Path if "Show My Track" enabled
  const { userLocation } = useLocation();
  const [userPath, setUserPath] = useState<Coordinate[]>([]);

  useEffect(() => {
      if (showTrack && userLocation) {
          setUserPath(prev => {
              const last = prev[prev.length - 1];
              // Add point if moved > 5 meters
              if (!last || (Math.abs(last.lat - userLocation.lat) > 0.00005 || Math.abs(last.lng - userLocation.lng) > 0.00005)) {
                  return [...prev, userLocation];
              }
              return prev;
          });
      }
  }, [userLocation, showTrack]);

  const mapPoints = points.filter(p => {
      if (p.isSectionHeader || p.playgroundId) return false;
      if (gameEnded) {
          if (!p.isCompleted && p.points > 0) return false;
      }
      if (mode === GameMode.PLAY && p.isHiddenBeforeScan && !p.isUnlocked) {
          return false;
      }
      return true;
  });
  
  const getLabel = (point: GamePoint) => {
      if (pointLabels && pointLabels[point.id]) return pointLabels[point.id];
      // Generate standard index label for Play Mode if not overridden by stats
      if (mode === GameMode.EDIT || mode === GameMode.PLAY) {
          // Find index in original points array to keep numbering consistent even if filtered? 
          // Better to use mapPoints index for visibility consistency.
          return (mapPoints.findIndex(p => p.id === point.id) + 1).toString();
      }
      return undefined;
  };

  return (
    <div className="relative w-full h-full z-0 bg-slate-900">
        {isRelocating && (
            <div className="absolute inset-0 pointer-events-none z-[5000] flex items-center justify-center">
                <div className="relative">
                    <Crosshair className="w-12 h-12 text-green-500 opacity-80" strokeWidth={2} />
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>
        )}

        {mapStyle === 'none' && (
            <div className="absolute inset-0 z-[0] bg-[#1a1a1a]">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:40px_40px]"></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white/5 font-black uppercase text-6xl tracking-[0.2em] select-none">BLANK MAP</span>
                </div>
            </div>
        )}

        <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }} 
            zoomControl={false}
        >
            <MapController handleRef={ref as any} />
            <MapLayers key={mapStyle} mapStyle={mapStyle} />
            <RecenterMap center={propLocation} points={mapPoints} mode={mode} />
            {(mode === GameMode.EDIT) && <MapClickParams onClick={onMapClick} />}
            
            {/* Routes */}
            {routes.map(route => {
                if (!route.isVisible) return null;
                const isHighlighted = highlightedRouteId === route.id;
                return (
                    <Polyline 
                        key={route.id}
                        positions={route.points.map(p => [p.lat, p.lng])}
                        pathOptions={{ color: isHighlighted ? '#f97316' : route.color, weight: isHighlighted ? 8 : 4, opacity: isHighlighted ? 1 : 0.7, interactive: true }}
                        eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); setHighlightedRouteId(isHighlighted ? null : route.id); }}}
                    />
                );
            })}

            {/* LIVE USER MARKER (Internal Context Consumer) */}
            <UserLocationMarker overrideLocation={propLocation} overrideAccuracy={propAccuracy} visible={showUserLocation} />
            
            {/* User Track (If enabled) */}
            {showTrack && userPath.length > 1 && (
                <Polyline positions={userPath.map(c => [c.lat, c.lng])} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.6, dashArray: '5, 10' }} />
            )}

            {/* Return Path (Game Ended) */}
            {gameEnded && returnPath && returnPath.length > 1 && (
                <Polyline 
                    positions={returnPath.map(c => [c.lat, c.lng])}
                    pathOptions={{ color: '#22c55e', weight: 6, dashArray: '10, 15', className: 'animate-pulse' }}
                />
            )}
            
            {/* Logic Links (Instructor/Edit) */}
            {logicLinks.map((link, i) => (
                <Polyline 
                    key={i} 
                    positions={[link.from, link.to]} 
                    pathOptions={{ color: link.color, weight: 2, dashArray: '5, 10', opacity: 0.6 }} 
                />
            ))}

            {/* Measure Path */}
            {measurePath.length > 1 && (
                <Polyline positions={measurePath} pathOptions={{ color: '#f97316', dashArray: '10, 10', weight: 4 }} />
            )}

            {/* Danger Zones */}
            {dangerZones.map(zone => (
                <DangerZoneMarker key={zone.id} zone={zone} onClick={onZoneClick} mode={mode} />
            ))}

            {/* Tasks */}
            {mapPoints.map(point => (
                <MapTaskMarker 
                    key={point.id} 
                    point={point} 
                    mode={mode} 
                    label={getLabel(point)}
                    showScore={showScores}
                    onClick={onPointClick}
                    onMove={onPointMove}
                    onDelete={onDeletePoint}
                    mapConfig={mapConfig} // Pass Config
                />
            ))}

            {/* Teams (Instructor Mode OR Captain View of Teammates) */}
            {teams && teams.map((t) => {
                if (mode === GameMode.PLAY && t.team.id === 'teammates') {
                    return (
                        <Marker 
                            key={`tm-${t.team.name}`} 
                            position={[t.location.lat, t.location.lng]} 
                            icon={createTeammateIcon(t.team.name)} 
                            zIndexOffset={900}
                        >
                            <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                                <span className="font-bold text-xs">{t.team.name}</span>
                            </Tooltip>
                        </Marker>
                    );
                }
                return (
                    <Marker 
                        key={t.team.id} 
                        position={[t.location.lat, t.location.lng]} 
                        icon={createTeamIcon(t.team.name, t.team.photoUrl, t.status)} 
                        zIndexOffset={1000}
                        eventHandlers={{ click: () => onTeamClick && onTeamClick(t.team.id) }}
                    >
                        {mode === GameMode.INSTRUCTOR && (
                            <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent>
                                <div className="text-center">
                                    <div className="font-black uppercase text-xs">{t.team.name}</div>
                                    {t.stats && <div className="text-[9px] font-bold text-green-600">{t.stats.mapSolved}/{t.stats.mapTotal}</div>}
                                </div>
                            </Tooltip>
                        )}
                    </Marker>
                );
            })}

            {/* Team Trails */}
            {Object.keys(teamTrails).map(teamId => (
                <Polyline 
                    key={teamId} 
                    positions={teamTrails[teamId]} 
                    pathOptions={{ color: getTeamColor(teamId), weight: 3, opacity: 0.5, dashArray: '2, 8' }} 
                />
            ))}

        </MapContainer>
    </div>
  );
}));

export default GameMap;
