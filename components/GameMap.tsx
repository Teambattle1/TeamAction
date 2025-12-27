
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, Polyline, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GamePoint, Coordinate, GameMode, MapStyleId, Team, DangerZone, TeamStatus, GameRoute } from '../types';
import { getLeafletIcon } from '../utils/icons';
import { Trash2, Crosshair, EyeOff, Image as ImageIcon, CheckCircle, HelpCircle, Zap, AlertTriangle, Lock, Users, Trophy, MessageSquare, MapPin } from 'lucide-react';

const UserIcon = L.divIcon({
  className: 'custom-user-icon',
  html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const getTeamColor = (teamName: string) => {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
};

const createTeamIcon = (teamName: string, photoUrl?: string, status?: TeamStatus) => {
    const color = getTeamColor(teamName);
    
    // Status Indicator logic
    let statusHtml = '';
    if (status) {
        let statusColor = '#ef4444'; // Red (Idle)
        let animation = '';
        
        if (status === 'solving') {
            statusColor = '#eab308'; // Yellow (Task Open)
        } else if (status === 'moving') {
            statusColor = '#22c55e'; // Green (Moving)
            animation = 'animation: pulse 1.5s infinite;';
        }

        statusHtml = `
            <div style="
                position: absolute; 
                top: -5px; 
                right: -5px; 
                width: 16px; 
                height: 16px; 
                background-color: ${statusColor}; 
                border: 2px solid white; 
                border-radius: 50%; 
                z-index: 10;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ${animation}
            "></div>
        `;
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

    return L.divIcon({
        className: 'custom-team-pin',
        html: pinHtml,
        iconSize: [60, 60],
        iconAnchor: [30, 56],
        popupAnchor: [0, -60]
    });
};

export interface GameMapHandle {
  fitBounds: (points: GamePoint[] | Coordinate[]) => void;
  getBounds: () => { ne: Coordinate; sw: Coordinate } | null;
  getCenter: () => Coordinate;
  jumpTo: (coord: Coordinate, zoom?: number) => void;
}

interface GameMapProps {
  userLocation: Coordinate | null;
  points: GamePoint[];
  teams?: { 
      team: Team, 
      location: Coordinate, 
      status?: TeamStatus,
      stats?: {
          rank: number;
          mapSolved: number;
          mapTotal: number;
          playgroundStats: { name: string; solved: number; total: number }[];
      }
  }[];
  teamTrails?: Record<string, Coordinate[]>; 
  pointLabels?: Record<string, string>; 
  measurePath?: Coordinate[];
  logicLinks?: { from: Coordinate; to: Coordinate; color?: string; type?: 'onOpen' | 'onCorrect' | 'onIncorrect' | 'open_playground' }[]; 
  playgroundMarkers?: { id: string; location: Coordinate; title: string; iconId: string }[]; 
  dangerZones?: DangerZone[];
  routes?: GameRoute[]; // New Prop 
  dependentPointIds?: string[]; 
  accuracy: number | null;
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
}

const MapClickParams = ({ onClick }: { onClick?: (c: Coordinate) => void }) => {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng);
    },
  });
  return null;
};

const RecenterMap = ({ center, points, mode }: { center: Coordinate | null, points: GamePoint[], mode: GameMode }) => {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    // If we have points and are in editing mode, try to fit bounds to them initially
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

    // If we have a user center, use it (especially for PLAY mode)
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
            
            // Check if pts is GamePoint[] or Coordinate[]
            if (pts.length > 0 && 'location' in pts[0]) {
                 const validPts = (pts as GamePoint[]).filter(p => p.location.lat !== 0 || p.location.lng !== 0);
                 latLngs = validPts.map(p => [p.location.lat, p.location.lng]);
            } else {
                 latLngs = (pts as Coordinate[]).map(c => [c.lat, c.lng]);
            }

            if (latLngs.length === 0) return;
            
            const bounds = L.latLngBounds(latLngs);
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            }
        },
        getBounds: () => {
            const b = map.getBounds();
            return {
                ne: { lat: b.getNorthEast().lat, lng: b.getNorthEast().lng },
                sw: { lat: b.getSouthWest().lat, lng: b.getSouthWest().lng }
            };
        },
        getCenter: () => {
            const c = map.getCenter();
            return { lat: c.lat, lng: c.lng };
        },
        jumpTo: (coord: Coordinate, zoom: number = 17) => {
            map.flyTo([coord.lat, coord.lng], zoom, { duration: 1.5 });
        }
    }));
    return null;
};

// --- MAP MARKERS ---

interface MapTaskMarkerProps {
  point: GamePoint;
  mode: GameMode;
  isSelected: boolean;
  isDependent: boolean;
  isRelocating?: boolean;
  label?: string;
  onClick: (p: GamePoint) => void;
  onMove?: (id: string, loc: Coordinate) => void;
  onDelete?: (id: string) => void;
  onHover?: (p: GamePoint | null) => void;
  showScore?: boolean;
}

const MapTaskMarker: React.FC<MapTaskMarkerProps> = ({ 
  point, 
  mode, 
  isSelected, 
  isDependent,
  isRelocating,
  label,
  onClick, 
  onMove, 
  onDelete,
  onHover,
  showScore
}) => {
  const markerRef = useRef<L.Marker>(null);
  const circleRef = useRef<L.Circle>(null);
  const isDraggingRef = useRef(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  
  const isDraggable = (mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR) && !isRelocating;
  const showGeofence = (mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR) && !isRelocating;

  const hasActions = (point.logic?.onOpen?.length || 0) > 0 || 
                     (point.logic?.onCorrect?.length || 0) > 0 || 
                     (point.logic?.onIncorrect?.length || 0) > 0;

  const isPlaygroundActivator = (point.logic?.onOpen?.some(a => a.type === 'open_playground') || 
                                 point.logic?.onCorrect?.some(a => a.type === 'open_playground') ||
                                 point.logic?.onIncorrect?.some(a => a.type === 'open_playground')) &&
                                 (mode === GameMode.EDIT); 

  const visualIsUnlocked = mode === GameMode.INSTRUCTOR ? true : point.isUnlocked;
  const visualIsCompleted = mode === GameMode.INSTRUCTOR ? false : point.isCompleted;
  const forcedColor = mode === GameMode.INSTRUCTOR ? '#ef4444' : undefined;

  useEffect(() => {
      if (markerRef.current && !isDraggingRef.current) {
          markerRef.current.setLatLng([point.location.lat, point.location.lng]);
      }
      if (circleRef.current && !isDraggingRef.current) {
          circleRef.current.setLatLng([point.location.lat, point.location.lng]);
      }
  }, [point.location.lat, point.location.lng]);

  const eventHandlers = React.useMemo(
    () => ({
      click: (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onClick(point);
      },
      mouseover: () => {
        if (onHover) {
          hoverTimeoutRef.current = window.setTimeout(() => {
            onHover(point);
          }, 1000);
        }
      },
      mouseout: () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        if (onHover) onHover(null);
      },
      dragstart: () => {
          isDraggingRef.current = true;
      },
      drag: (e: L.LeafletEvent) => {
          const marker = e.target as L.Marker;
          if (circleRef.current) {
              circleRef.current.setLatLng(marker.getLatLng());
          }
      },
      dragend(e: L.LeafletEvent) {
        isDraggingRef.current = false;
        const marker = e.target as L.Marker;
        const evt = e as L.LeafletMouseEvent; // Cast to access original event
        
        // CHECK IF DROPPED ON TRASH BIN
        if (onDelete && evt.originalEvent) {
            const trash = document.getElementById('game-trash-bin');
            if (trash) {
                const rect = trash.getBoundingClientRect();
                const { clientX, clientY } = evt.originalEvent;
                if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                    onDelete(point.id);
                    return;
                }
            }
        }

        if (marker && onMove) {
            const ll = marker.getLatLng();
            onMove(point.id, { lat: ll.lat, lng: ll.lng });
        }
      },
    }),
    [point, onClick, onMove, onDelete, onHover, mode]
  );

  useEffect(() => {
      const marker = markerRef.current;
      if (marker) {
          let targetOpacity = 1;
          if (isRelocating) targetOpacity = 0.4;
          else if (isDependent && mode === GameMode.EDIT) targetOpacity = 0.6;
          else if (isDraggable) targetOpacity = 0.9;

          marker.setOpacity(targetOpacity);
          marker.setZIndexOffset(isSelected ? 1000 : (isDraggable ? 500 : 0));
          
          if (marker.getElement()) {
              if (isDependent && mode === GameMode.EDIT) {
                  marker.getElement()!.style.filter = 'grayscale(100%)';
              } else {
                  marker.getElement()!.style.filter = 'none';
              }
          }

          if (marker.dragging) isDraggable ? marker.dragging.enable() : marker.dragging.disable();
      }
  }, [isSelected, isDraggable, isRelocating, isDependent, mode]);

  const defaultStatusColor = visualIsCompleted ? '#22c55e' : (visualIsUnlocked ? '#eab308' : '#ef4444');
  const strokeColor = isSelected ? '#4f46e5' : (forcedColor || defaultStatusColor);
  const fillColor = point.areaColor || strokeColor;

  return (
    <>
      <Marker 
        draggable={isDraggable} 
        eventHandlers={eventHandlers} 
        position={[point.location.lat, point.location.lng]} 
        icon={getLeafletIcon(
            point.iconId, 
            visualIsUnlocked, 
            visualIsCompleted, 
            label, 
            (hasActions || point.isHiddenBeforeScan) && (mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR), 
            forcedColor, 
            point.isHiddenBeforeScan, 
            showScore ? point.points : undefined, 
            point.iconUrl,
            isPlaygroundActivator
        )} 
        ref={markerRef} 
      />
      <Circle 
        ref={circleRef} 
        center={[point.location.lat, point.location.lng]} 
        radius={point.radiusMeters} 
        pathOptions={{ 
            color: strokeColor, 
            fillColor: fillColor, 
            fillOpacity: showGeofence ? (isSelected ? 0.4 : 0.2) : 0.1, 
            weight: showGeofence ? (isSelected ? 3 : 2) : 1, 
            dashArray: visualIsUnlocked ? undefined : '5, 5',
            interactive: false 
        }} 
      />
    </>
  );
};

const DangerZoneMarker: React.FC<{ 
    zone: DangerZone; 
    mode: GameMode; 
    onMove?: (id: string, loc: Coordinate) => void; 
    onDelete?: (id: string) => void;
    onClick?: (zone: DangerZone) => void;
}> = ({ zone, mode, onMove, onDelete, onClick }) => {
    const eventHandlers = React.useMemo(() => ({
        click: (e: L.LeafletMouseEvent) => {
            if (mode === GameMode.EDIT && onClick) {
                L.DomEvent.stopPropagation(e);
                onClick(zone);
            }
        },
        dragend(e: L.LeafletEvent) {
            const marker = e.target as L.Marker;
            const evt = e as L.LeafletMouseEvent;
            
            // CHECK IF DROPPED ON TRASH BIN
            if (onDelete && evt.originalEvent) {
                const trash = document.getElementById('game-trash-bin');
                if (trash) {
                    const rect = trash.getBoundingClientRect();
                    const { clientX, clientY } = evt.originalEvent;
                    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                        onDelete(zone.id);
                        return;
                    }
                }
            }

            if (marker && onMove) {
                const ll = marker.getLatLng();
                onMove(zone.id, { lat: ll.lat, lng: ll.lng });
            }
        }
    }), [zone, onMove, onDelete, onClick, mode]);

    const isDraggable = mode === GameMode.EDIT;

    // Create Label for Title if it exists
    const getZoneIcon = () => {
        let html = getLeafletIcon('skull', true, false, undefined, false, '#ef4444').options.html || '';
        
        if (zone.title) {
            // Remove closing div from base icon
            html = html.replace('</div>', '');
            // Append Label centered above
            html += `<div style="position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background-color: #ef4444; color: white; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 8px; border: 2px solid white; z-index: 20; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); text-transform: uppercase;">${zone.title}</div></div>`;
        }
        
        return L.divIcon({
            className: 'custom-game-icon',
            html: html,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
        });
    };

    return (
        <>
            {isDraggable && (
                <Marker
                    position={[zone.location.lat, zone.location.lng]}
                    draggable={true}
                    eventHandlers={eventHandlers}
                    icon={getZoneIcon()}
                    zIndexOffset={900}
                />
            )}
            {/* If not draggable (Play mode), render marker only if title exists so users can see name on map? Or maybe just render marker always in play mode? Assuming visibility is desired. */}
            {!isDraggable && (
                <Marker
                    position={[zone.location.lat, zone.location.lng]}
                    interactive={false}
                    icon={getZoneIcon()}
                    zIndexOffset={400}
                />
            )}
            <Circle 
                center={[zone.location.lat, zone.location.lng]}
                radius={zone.radius}
                pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.3,
                    weight: 2,
                    dashArray: '10, 10', 
                    className: 'danger-zone-circle',
                    interactive: false
                }}
            />
        </>
    );
};

const MAP_LAYERS: Record<MapStyleId, { url: string; attribution: string; overlayUrl?: string }> = {
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap' },
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap' },
  clean: { url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap, &copy; CartoDB' },
  voyager: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap, &copy; CartoDB' },
  winter: { url: 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png', attribution: '&copy; Kartverket' },
  ski: { 
      // Switch base to standard OSM to avoid blank screens from OpenTopoMap
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
      overlayUrl: 'https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors | Pistes: &copy; OpenSnowMap' 
  },
  ancient: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' }, 
};

// Isolated Layer Component to force re-mounting on style change
const MapLayers: React.FC<{ mapStyle: MapStyleId }> = ({ mapStyle }) => {
    const currentLayer = MAP_LAYERS[mapStyle] || MAP_LAYERS.osm;
    
    // Keying by mapStyle ensures React fully unmounts the old layer and mounts the new one
    // preventing Leaflet tile caching issues.
    return (
        <>
            <TileLayer 
                key={mapStyle} 
                attribution={currentLayer.attribution} 
                url={currentLayer.url} 
                zIndex={0}
            />
            {currentLayer.overlayUrl && (
                <TileLayer 
                    key={`${mapStyle}-overlay`}
                    url={currentLayer.overlayUrl} 
                    zIndex={1} 
                />
            )}
        </>
    );
};

const GameMap = forwardRef<GameMapHandle, GameMapProps>(({ 
    userLocation, 
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
    accuracy, 
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
    onZoneClick 
}, ref) => {
  const center = userLocation || { lat: 55.6761, lng: 12.5683 };
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null);

  const mapPoints = points.filter(p => {
      if (p.isSectionHeader || p.playgroundId) return false;
      if (mode === GameMode.PLAY && p.isHiddenBeforeScan && !p.isUnlocked) {
          return false;
      }
      return true;
  });
  
  const getLabel = (point: GamePoint) => {
      if (pointLabels && pointLabels[point.id]) return pointLabels[point.id];
      if (mode === GameMode.EDIT) return (points.findIndex(p => p.id === point.id) + 1).toString().padStart(3, '0');
      return undefined;
  };

  const measurePathKey = measurePath && measurePath.length > 0 ? measurePath.map(p => `${p.lat},${p.lng}`).join('|') : 'empty';

  return (
    <div className="relative w-full h-full z-0">
        {isRelocating && (
            <div className="absolute inset-0 pointer-events-none z-[5000] flex items-center justify-center">
                <div className="relative">
                    <Crosshair className="w-12 h-12 text-green-500 opacity-80" strokeWidth={2} />
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>
        )}

        <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
        >
            <MapController handleRef={ref as any} />
            
            <MapLayers key={mapStyle} mapStyle={mapStyle} />
            
            <RecenterMap center={userLocation} points={mapPoints} mode={mode} />
            
            {(mode === GameMode.EDIT) && <MapClickParams onClick={onMapClick} />}
            
            {/* ROUTES / GPX OVERLAYS */}
            {routes.map(route => {
                if (!route.isVisible) return null;
                const isHighlighted = highlightedRouteId === route.id;
                
                return (
                    <Polyline 
                        key={route.id}
                        positions={route.points.map(p => [p.lat, p.lng])}
                        pathOptions={{ 
                            color: isHighlighted ? '#f97316' : route.color, 
                            weight: isHighlighted ? 8 : 4, 
                            opacity: isHighlighted ? 1 : 0.7,
                            shadowBlur: isHighlighted ? 10 : 0,
                            interactive: true
                        }}
                        eventHandlers={{
                            click: (e) => {
                                L.DomEvent.stopPropagation(e);
                                setHighlightedRouteId(isHighlighted ? null : route.id);
                            }
                        }}
                    >
                        <Tooltip sticky direction="top" className="custom-leaflet-tooltip">
                            <span className="font-bold uppercase text-xs bg-black/80 text-white px-2 py-1 rounded shadow-md border border-white/20">
                                {route.name}
                            </span>
                        </Tooltip>
                    </Polyline>
                );
            })}

            {userLocation && (
                <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon} zIndexOffset={500} />
                {accuracy !== null && (
                    <Circle 
                        center={[userLocation.lat, userLocation.lng]} 
                        radius={accuracy} 
                        pathOptions={{ 
                            fillColor: '#3b82f6', 
                            fillOpacity: 0.1, 
                            color: '#3b82f6', 
                            weight: 1,
                            dashArray: '5, 5',
                            interactive: false
                        }} 
                    />
                )}
                </>
            )}
            
            {logicLinks && logicLinks.map((link, idx) => {
                if (!link.from || !link.to || typeof link.from.lat !== 'number' || typeof link.to.lat !== 'number') return null;
                if (link.type === 'open_playground') return null;
                const key = `link-${idx}`;
                const color = link.color || '#eab308';
                return <Polyline key={key} positions={[[link.from.lat, link.from.lng], [link.to.lat, link.to.lng]]} pathOptions={{ color: color, weight: 3, dashArray: '10, 10', opacity: 0.8, interactive: false }} />;
            })}

            {dangerZones && dangerZones.map(zone => (
                <DangerZoneMarker 
                    key={zone.id} 
                    zone={zone} 
                    mode={mode} 
                    onMove={onPointMove} 
                    onDelete={onDeletePoint}
                    onClick={onZoneClick}
                />
            ))}

            {playgroundMarkers && playgroundMarkers.map((pg) => (
                <Marker 
                    key={`pg-marker-${pg.id}`}
                    position={[pg.location.lat, pg.location.lng]}
                    icon={getLeafletIcon(pg.iconId as any || 'default', true, false, undefined, false, '#3b82f6', false)}
                    zIndexOffset={800}
                    draggable={mode === GameMode.EDIT}
                    eventHandlers={{ 
                        dragend: (e) => { 
                            if (onPointMove) onPointMove(pg.id, (e.target as L.Marker).getLatLng()); 
                        } 
                    }}
                />
            ))}

            {measurePath && (
                <>
                    {measurePath.length > 1 && (
                        <Polyline 
                            key={measurePathKey}
                            positions={measurePath.map(c => [c.lat, c.lng])} 
                            pathOptions={{ color: '#ec4899', weight: 4, dashArray: '10, 10', opacity: 0.8, interactive: false }} 
                        />
                    )}
                    {measurePath.map((pos, idx) => (
                        <Circle 
                            key={`measure-point-${idx}`}
                            center={[pos.lat, pos.lng]}
                            radius={4}
                            pathOptions={{ color: '#ec4899', fillColor: '#fff', fillOpacity: 1, weight: 2, interactive: false }}
                        />
                    ))}
                </>
            )}
            
            {mapPoints.map(point => (
                <MapTaskMarker 
                    key={point.id} 
                    point={point} 
                    mode={mode} 
                    isRelocating={isRelocating} 
                    isSelected={selectedPointId === point.id} 
                    isDependent={!!(dependentPointIds && dependentPointIds.includes(point.id))}
                    label={getLabel(point)} 
                    onClick={onPointClick} 
                    onMove={onPointMove} 
                    onDelete={onDeletePoint} 
                    onHover={onPointHover} 
                    showScore={showScores}
                />
            ))}
            
            {/* Render Teams if provided (e.g. Instructor Mode) */}
            {teams && teams.map(t => (
                <Marker
                    key={t.team.id}
                    position={[t.location.lat, t.location.lng]}
                    icon={createTeamIcon(t.team.name, t.team.photoUrl, t.status)}
                    zIndexOffset={600}
                    eventHandlers={{
                        click: () => onTeamClick && onTeamClick(t.team.id)
                    }}
                />
            ))}
            
            {/* Render Team Trails if provided */}
            {teamTrails && Object.entries(teamTrails).map(([teamId, trail]) => {
                if (!Array.isArray(trail) || trail.length < 2) return null;
                return (
                    <Polyline 
                        key={`trail-${teamId}`}
                        positions={trail.map(c => [c.lat, c.lng])}
                        pathOptions={{ color: getTeamColor(teamId), weight: 2, dashArray: '5, 5', opacity: 0.5, interactive: false }}
                    />
                );
            })}
        </MapContainer>
    </div>
  );
});

export default GameMap;
