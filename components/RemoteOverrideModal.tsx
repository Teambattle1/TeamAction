import React, { useState, useEffect } from 'react';
import { X, Zap, MapPin, CheckCircle, AlertTriangle, Navigation } from 'lucide-react';
import { Team, GamePoint, Coordinate } from '../types';
import * as db from '../services/db';

interface RemoteOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  teams: Team[];
  tasks: GamePoint[];
  onTaskForceComplete?: (teamId: string, taskId: string) => Promise<void>;
  onTeamTeleport?: (teamId: string, location: Coordinate) => Promise<void>;
  onJumpToLocation?: (location: Coordinate) => void;
}

const RemoteOverrideModal: React.FC<RemoteOverrideModalProps> = ({
  isOpen,
  onClose,
  gameId,
  teams,
  tasks,
  onTaskForceComplete,
  onTeamTeleport,
  onJumpToLocation,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [overrideType, setOverrideType] = useState<'force_complete' | 'teleport' | null>(null);
  const [selectedTask, setSelectedTask] = useState<GamePoint | null>(null);
  const [teleportLocation, setTeleportLocation] = useState<Coordinate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedTeam(null);
    setOverrideType(null);
    setSelectedTask(null);
    setTeleportLocation(null);
    setFeedback(null);
  };

  const handleForceComplete = async () => {
    if (!selectedTeam || !selectedTask) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      if (onTaskForceComplete) {
        await onTaskForceComplete(selectedTeam.id, selectedTask.id);
      } else {
        // Default implementation - add task to completed list
        const updatedCompletedIds = [...(selectedTeam.completedPointIds || []), selectedTask.id];
        await db.updateTeam(selectedTeam.id, {
          ...selectedTeam,
          completedPointIds: updatedCompletedIds,
        });
      }

      setFeedback({
        type: 'success',
        message: `✅ Task "${selectedTask.title}" marked as completed for ${selectedTeam.name}`,
      });

      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Error forcing task completion:', error);
      setFeedback({
        type: 'error',
        message: '❌ Failed to complete task. Check console for details.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTeleport = async () => {
    if (!selectedTeam || !teleportLocation) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      if (onTeamTeleport) {
        await onTeamTeleport(selectedTeam.id, teleportLocation);
      }

      setFeedback({
        type: 'success',
        message: `✅ ${selectedTeam.name} teleported to new location`,
      });

      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Error teleporting team:', error);
      setFeedback({
        type: 'error',
        message: '❌ Failed to teleport team. Check console for details.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const incompleteTasks = tasks.filter(
    (t) => selectedTeam && !selectedTeam.completedPointIds?.includes(t.id)
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-orange-600 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-900/50 to-red-900/50 border-b-2 border-orange-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  Remote Override
                </h2>
                <p className="text-xs text-orange-200 font-bold uppercase tracking-wide">
                  Emergency Game Master Controls
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-800/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Warning Banner */}
          <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-red-400 uppercase mb-1">Warning</h3>
              <p className="text-xs text-red-200">
                These controls bypass normal game rules. Use only when technical issues occur in the
                field.
              </p>
            </div>
          </div>

          {/* Team Selection */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              Select Team
            </label>
            <div className="grid grid-cols-2 gap-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTeam?.id === team.id
                      ? 'bg-orange-600 border-orange-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-orange-600'
                  }`}
                >
                  <div className="font-bold text-sm">{team.name}</div>
                  <div className="text-xs opacity-70">
                    {team.completedPointIds?.length || 0} tasks completed
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Override Type Selection */}
          {selectedTeam && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Override Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOverrideType('force_complete')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    overrideType === 'force_complete'
                      ? 'bg-green-900/30 border-green-600'
                      : 'bg-slate-800 border-slate-700 hover:border-green-600'
                  }`}
                >
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">Force Complete Task</div>
                  <div className="text-xs text-slate-400 mt-1">Mark task as solved</div>
                </button>

                <button
                  onClick={() => setOverrideType('teleport')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    overrideType === 'teleport'
                      ? 'bg-blue-900/30 border-blue-600'
                      : 'bg-slate-800 border-slate-700 hover:border-blue-600'
                  }`}
                >
                  <MapPin className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white">Teleport Team</div>
                  <div className="text-xs text-slate-400 mt-1">Fix GPS drift</div>
                </button>
              </div>
            </div>
          )}

          {/* Force Complete - Task Selection */}
          {selectedTeam && overrideType === 'force_complete' && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Select Task to Complete
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {incompleteTasks.length === 0 ? (
                  <div className="p-4 bg-slate-800 rounded-lg text-center text-sm text-slate-400">
                    All tasks completed for this team
                  </div>
                ) : (
                  incompleteTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        selectedTask?.id === task.id
                          ? 'bg-green-900/30 border-green-600'
                          : 'bg-slate-800 border-slate-700 hover:border-green-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm text-white">{task.title}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {task.points} points • {task.task.type}
                          </div>
                        </div>
                        {task.location && onJumpToLocation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToLocation(task.location!);
                            }}
                            className="p-2 hover:bg-slate-700 rounded-lg"
                            title="Jump to location"
                          >
                            <Navigation className="w-4 h-4 text-blue-400" />
                          </button>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Teleport - Location Selection */}
          {selectedTeam && overrideType === 'teleport' && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                Select Destination
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tasks
                  .filter((t) => t.location)
                  .map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setTeleportLocation(task.location!)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        teleportLocation?.lat === task.location?.lat &&
                        teleportLocation?.lng === task.location?.lng
                          ? 'bg-blue-900/30 border-blue-600'
                          : 'bg-slate-800 border-slate-700 hover:border-blue-600'
                      }`}
                    >
                      <div className="font-bold text-sm text-white">{task.title}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {task.location?.lat.toFixed(5)}, {task.location?.lng.toFixed(5)}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border-2 ${
                feedback.type === 'success'
                  ? 'bg-green-900/30 border-green-600 text-green-200'
                  : 'bg-red-900/30 border-red-600 text-red-200'
              }`}
            >
              <p className="text-sm font-bold">{feedback.message}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-950 border-t-2 border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold uppercase text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={overrideType === 'force_complete' ? handleForceComplete : handleTeleport}
            disabled={
              isProcessing ||
              !selectedTeam ||
              !overrideType ||
              (overrideType === 'force_complete' && !selectedTask) ||
              (overrideType === 'teleport' && !teleportLocation)
            }
            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold uppercase text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Execute Override
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoteOverrideModal;
