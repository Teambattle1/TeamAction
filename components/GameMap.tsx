
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { GamePoint, Coordinate, GameMode, MapStyleId, Team } from '../types';
import { getLeafletIcon } from '../utils/icons';
import { Trash2 } from 'lucide-react';

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

const createTeamIcon = (teamName: string) => {
    const color = getTeamColor(teamName);
    return L.divIcon({
        className: 'custom-team-icon',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: white;">${teamName.charAt(0).toUpperCase()}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

export interface GameMapHandle {
  fitBounds: (points: GamePoint[]) => void;
  getBounds: () => { ne: Coordinate; sw: Coordinate } | null;
  getCenter: () => Coordinate;
  jumpTo: (coord: Coordinate, zoom?: number) => void;
}

interface GameMapProps {
  userLocation: Coordinate | null;
  points: GamePoint[];
  teams?: { team: Team, location: Coordinate }[]; 
  teamTrails?: Record<string, Coordinate[]>; 
  pointLabels?: Record<string, string>; 
  accuracy: number | null;
  mode: GameMode;
  mapStyle: MapStyleId;
  selectedPointId?: string | null;
  onPointClick: (point: GamePoint) => void;
  onTeamClick?: (teamId: string) => void; 
  onMapClick?: (coord: Coordinate) => void;
  onPointMove?: (pointId: string, newLoc: Coordinate) => void;
  onDeletePoint?: (pointId: string) => void;
  onPointHover?: (point: GamePoint | null) => void;
}

const MapClickParams = ({ onClick }: { onClick?: (c: Coordinate) => void }) => {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng);
    },
  });
  return null;
};

const RecenterMap = ({ center }: { center: Coordinate | null }) => {
  const map = useMap();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (center && !initialized) {
      map.setView([center.lat, center.lng], 16);
      setInitialized(true);
    }
  }, [center, map, initialized]);

  return null;
};

const MapController = ({ handleRef }: { handleRef: React.RefObject<any> }) => {
    const map = useMap();
    useImperativeHandle(handleRef, () => ({
        fitBounds: (pts: GamePoint[]) => {
            if (pts.length === 0) return;
            const bounds = L.latLngBounds(pts.map(p => [p.location.lat, p.location.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
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

/**
 * Interface for MapTaskMarker props to satisfy TypeScript and React requirements.
 */
interface MapTaskMarkerProps {
  point: GamePoint;
  mode: GameMode;
  isSelected: boolean;
  label?: string;
  onClick: (p: GamePoint) => void;
  onMove?: (id: string, loc: Coordinate) => void;
  onDelete?: (id: string) => void;
  onHover?: (p: GamePoint | null) => void;
}

/**
 * Component for rendering individual task markers with potential interactions like dragging.
 */
const MapTaskMarker: React.FC<MapTaskMarkerProps> = ({ 
  point, 
  mode, 
  isSelected,
  label,
  onClick, 
  onMove,
  onDelete,
  onHover
}) => {
  
  const markerRef = useRef<L.Marker>(null);
  const circleRef = useRef<L.Circle>(null);
  const isDraggingRef = useRef(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const map = useMap(); 
  const isDraggable = mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR;
  const showGeofence = mode === GameMode.EDIT || mode === GameMode.INSTRUCTOR;

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
      click: () => onClick(point),
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
          const trash = document.getElementById('map-trash-bin');
          if (trash) {
              trash.classList.add('bg-red-600', 'text-white', 'border-red-600', 'scale-110');
              trash.classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-400', 'dark:text-gray-200', 'border-gray-100', 'dark:border-gray-700');
          }
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
        const trash = document.getElementById('map-trash-bin');
        
        if (trash) {
            trash.classList.remove('bg-red-600', 'text-white', 'border-red-600', 'scale-110');
            trash.classList.add('bg-white', 'dark:bg-gray-800', 'text-gray-400', 'dark:text-gray-200', 'border-gray-100', 'dark:border-gray-700');
        }

        if (marker) {
          if (mode === GameMode.EDIT && onDelete && trash) {
              const markerPoint = map.latLngToContainerPoint(marker.getLatLng());
              const trashRect = trash.getBoundingClientRect();
              const mapRect = map.getContainer().getBoundingClientRect();
              const hitX = mapRect.left + markerPoint.x;
              const hitY = mapRect.top + markerPoint.y;
              const hitMargin = 40;
              if (hitX >= trashRect.left - hitMargin && hitX <= trashRect.right + hitMargin && hitY >= trashRect.top - hitMargin && hitY <= trashRect.bottom + hitMargin) {
                  onDelete(point.id); return; 
              }
          }
          if (onMove) onMove(point.id, marker.getLatLng());
        }
      },
    }),
    [point, onClick, onMove, onDelete, onHover, map, mode]
  );

  useEffect(() => {
      const marker = markerRef.current;
      if (marker) {
          marker.setOpacity(isSelected ? 1 : (isDraggable ? 0.9 : 1));
          marker.setZIndexOffset(isSelected ? 1000 : (isDraggable ? 500 : 0));
          if (marker.dragging) isDraggable ? marker.dragging.enable() : marker.dragging.disable();
      }
  }, [isSelected, isDraggable]);

  return (
    <>
      <Marker draggable={isDraggable} eventHandlers={eventHandlers} position={[point.location.lat, point.location.lng]} icon={getLeafletIcon(point.iconId, point.isUnlocked, point.isCompleted, label)} ref={markerRef} />
      <Circle ref={circleRef} center={[point.location.lat, point.location.lng]} radius={point.radiusMeters} pathOptions={{ color: isSelected ? '#4f46e5' : (point.isUnlocked ? (point.isCompleted ? '#22c55e' : '#eab308') : '#ef4444'), fillColor: isSelected ? '#6366f1' : (point.isUnlocked ? (point.isCompleted ? '#22c55e' : '#eab308') : '#ef4444'), fillOpacity: showGeofence ? (isSelected ? 0.4 : 0.2) : 0.1, weight: showGeofence ? (isSelected ? 3 : 2) : 1, dashArray: point.isUnlocked ? undefined : '5, 5' }} />
    </>
  );
};

const MAP_LAYERS: Record<MapStyleId, { url: string; attribution: string }> = {
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap' },
  light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap' }
};

const GameMap = forwardRef<GameMapHandle, GameMapProps>(({ userLocation, points, teams, teamTrails, pointLabels, accuracy, mode, mapStyle, selectedPointId, onPointClick, onTeamClick, onMapClick, onPointMove, onDeletePoint, onPointHover }, ref) => {
  const center = userLocation || { lat: 55.6761, lng: 12.5683 };
  const currentLayer = MAP_LAYERS[mapStyle] || MAP_LAYERS.osm;
  const mapPoints = points.filter(p => !p.isSectionHeader);
  const getLabel = (point: GamePoint) => {
      if (pointLabels && pointLabels[point.id]) return pointLabels[point.id];
      if (mode === GameMode.EDIT) return (points.findIndex(p => p.id === point.id) + 1).toString().padStart(3, '0');
      return undefined;
  };
  return (
    <div className="relative w-full h-full">
        <MapContainer center={[center.lat, center.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <MapController handleRef={ref as any} />
            <TileLayer attribution={currentLayer.attribution} url={currentLayer.url} />
            <RecenterMap center={userLocation} />
            {mode === GameMode.EDIT && <MapClickParams onClick={onMapClick} />}
            {userLocation && (
                <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon} zIndexOffset={500} />
                {accuracy && <Circle center={[userLocation.lat, userLocation.lng]} radius={accuracy} pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1 }} />}
                </>
            )}
            {teamTrails && teams && Object.entries(teamTrails).map(([teamId, path]) => {
                const team = teams.find(t => t.team.id === teamId)?.team;
                // Cast path to Coordinate[] as Object.entries can lose type specificity in some contexts
                const pathCoords = path as Coordinate[];
                if (!team || pathCoords.length < 2) return null;
                return <Polyline key={`trail-${teamId}`} positions={pathCoords.map(c => [c.lat, c.lng])} pathOptions={{ color: getTeamColor(team.name), weight: 3, opacity: 0.6, dashArray: '5, 10' }} />;
            })}
            {teams && teams.map((item, idx) => <Marker key={`team-${item.team.id}-${idx}`} position={[item.location.lat, item.location.lng]} icon={createTeamIcon(item.team.name)} eventHandlers={{ click: () => onTeamClick && onTeamClick(item.team.id) }} zIndexOffset={1000} />)}
            {mapPoints.map(point => <MapTaskMarker key={point.id} point={point} mode={mode} isSelected={selectedPointId === point.id} label={getLabel(point)} onClick={onPointClick} onMove={onPointMove} onDelete={onDeletePoint} onHover={onPointHover} />)}
        </MapContainer>
        {mode === GameMode.EDIT && (
            <div id="map-trash-bin" className="absolute bottom-6 right-4 z-[2000] shadow-xl rounded-full p-3 transition-all border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-200 pointer-events-auto flex items-center justify-center w-14 h-14" title="Drag task here to delete"><Trash2 className="w-6 h-6 pointer-events-none" /></div>
        )}
    </div>
  );
});

export default GameMap;
