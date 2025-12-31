import React, { useState, useRef } from 'react';
import { X, MapPin, AlertCircle } from 'lucide-react';
import { GamePoint, Coordinate } from '../types';

interface TaskPlacementToolProps {
    selectedTasks: GamePoint[];
    mapRef: React.RefObject<any>;
    onClose: () => void;
    onPlaceTasks: (placedTasks: GamePoint[]) => void;
}

const TaskPlacementTool: React.FC<TaskPlacementToolProps> = ({
    selectedTasks,
    mapRef,
    onClose,
    onPlaceTasks
}) => {
    const [distanceMeters, setDistanceMeters] = useState(100);
    const [snapToRoad, setSnapToRoad] = useState(false);
    const [placingMode, setPlacingMode] = useState(false);
    const [placedCount, setPlacedCount] = useState(0);
    const clickPointRef = useRef<Coordinate | null>(null);

    const handleMapClick = async (e: any) => {
        if (!placingMode) return;

        const { lng, lat } = e.lngLat;
        const startPoint: Coordinate = { lat, lng };
        clickPointRef.current = startPoint;

        try {
            // Snap to road if enabled
            let currentPoint = startPoint;
            if (snapToRoad && mapRef.current) {
                currentPoint = await snapToRoadPoint(startPoint);
            }

            // Place tasks along a line/path
            const placedTasks = selectedTasks.map((task, index) => ({
                ...task,
                location: calculatePointAlongPath(currentPoint, index, distanceMeters)
            }));

            onPlaceTasks(placedTasks);
            setPlacedCount(placedCount + placedTasks.length);
            
            // Reset for next batch
            setPlacingMode(false);
        } catch (error) {
            console.error('Error placing tasks:', error);
        }
    };

    const calculatePointAlongPath = (startPoint: Coordinate, index: number, distance: number): Coordinate => {
        // Simple calculation: move south for each task
        // In production, you'd calculate along a bearing/route
        const metersPerDegree = 111000; // Approximate at equator
        const degreesPerMeter = 1 / metersPerDegree;
        
        const offsetDegrees = (index * distance) * degreesPerMeter;
        
        return {
            lat: startPoint.lat - offsetDegrees,
            lng: startPoint.lng
        };
    };

    const snapToRoadPoint = async (point: Coordinate): Promise<Coordinate> => {
        try {
            // Using Mapbox Snap to Road API (requires Mapbox token)
            // This is a placeholder - would need actual API integration
            console.log('Snapping to road for:', point);
            return point; // Return snapped point
        } catch (error) {
            console.error('Error snapping to road:', error);
            return point;
        }
    };

    return (
        <div className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                            <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Place Tasks on Map</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected Tasks Info */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-slate-300">
                        <span className="font-bold text-white">{selectedTasks.length}</span> tasks to place
                    </p>
                    {placedCount > 0 && (
                        <p className="text-xs text-green-400 mt-1">
                            ✓ {placedCount} tasks placed
                        </p>
                    )}
                </div>

                {/* Distance Control */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-300 mb-2">
                        Distance Between Tasks
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="10"
                            max="1000"
                            step="10"
                            value={distanceMeters}
                            onChange={(e) => setDistanceMeters(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-sm font-bold text-white min-w-[50px] text-right">
                            {distanceMeters}m
                        </span>
                    </div>
                </div>

                {/* Snap to Road Toggle */}
                <div className="mb-6 flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <input
                        type="checkbox"
                        id="snapToRoad"
                        checked={snapToRoad}
                        onChange={(e) => setSnapToRoad(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 accent-blue-600 cursor-pointer"
                    />
                    <label htmlFor="snapToRoad" className="flex-1 cursor-pointer">
                        <p className="text-sm font-bold text-white">Snap to Road</p>
                        <p className="text-xs text-slate-400">Tasks will align with road network</p>
                    </label>
                </div>

                {/* Instructions */}
                <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 mb-6 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200">
                        {placingMode ? (
                            <p>Click on the map to place {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} at {distanceMeters}m intervals</p>
                        ) : (
                            <p>Click "Start Placing" then click on the map to position your tasks</p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setPlacingMode(!placingMode)}
                        className={`flex-1 py-2.5 rounded-lg font-bold uppercase text-xs tracking-wide transition-all ${
                            placingMode
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {placingMode ? '✓ Ready to Place' : '🎯 Start Placing'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg font-bold uppercase text-xs tracking-wide bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    >
                        Close
                    </button>
                </div>

                {/* Note */}
                <p className="text-[10px] text-slate-500 mt-4 text-center">
                    Requires Mapbox token for snap-to-road feature
                </p>
            </div>
        </div>
    );
};

export default TaskPlacementTool;
