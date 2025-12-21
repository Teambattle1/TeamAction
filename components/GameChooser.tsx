
import React, { useState, useMemo } from 'react';
import { Game, TaskList } from '../types';
import { X, Calendar, CheckCircle, Play, MapPin, ChevronRight, Trophy, LayoutTemplate, Gamepad2, Save, RefreshCw, Home, Plus, Zap, Clock } from 'lucide-react';

interface GameChooserProps {
  games: Game[];
  taskLists: TaskList[];
  onSelectGame: (id: string) => void;
  onCreateGame: (name: string, fromTaskListId?: string) => void;
  onClose: () => void;
  onSaveAsTemplate?: (gameId: string, name: string) => void;
  onRefresh?: () => void;
}

type MainView = 'GAMES' | 'TEMPLATES';
type SessionTab = 'TODAY' | 'PLANNED' | 'COMPLETED';

const GameChooser: React.FC<GameChooserProps> = ({ 
  games, 
  taskLists,
  onSelectGame, 
  onCreateGame, 
  onClose,
  onSaveAsTemplate,
  onRefresh
}) => {
  const [mainView, setMainView] = useState<MainView>('GAMES');
  const [sessionTab, setSessionTab] = useState<SessionTab>('TODAY');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredGames = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkCompletion = (game: Game) => {
        if (!game.points || game.points.length === 0) return false;
        return game.points.every(p => p.isCompleted);
    };

    return games.filter(g => {
        const gDate = new Date(g.createdAt);
        gDate.setHours(0, 0, 0, 0);
        
        const isFinished = checkCompletion(g);
        const isOverdue = gDate.getTime() < today.getTime();
        const isToday = gDate.getTime() === today.getTime();
        const isFuture = gDate.getTime() > today.getTime();

        if (sessionTab === 'COMPLETED') {
            // Show if finished OR overdue (past date)
            return isFinished || isOverdue;
        }
        
        // For TODAY and PLANNED, exclude finished or overdue games
        if (isFinished || isOverdue) return false;

        if (sessionTab === 'TODAY') return isToday;
        if (sessionTab === 'PLANNED') return isFuture;
        
        return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [games, sessionTab]);

  const handleCreateFromTemplate = (list: TaskList) => {
      const name = prompt(`Name for new game based on "${list.name}":`, list.name);
      if (name) {
          onCreateGame(name, list.id);
      }
  };

  const handleCreateBlankGame = () => {
      const name = prompt("Name for new empty game:", "New Game");
      if (name) {
          onCreateGame(name);
      }
  };

  const handleSaveTemplateClick = (e: React.MouseEvent, game: Game) => {
      e.stopPropagation();
      if (!onSaveAsTemplate) return;
      const name = prompt("Enter a name for this new template:", `${game.name} Template`);
      if (name) {
          onSaveAsTemplate(game.id, name);
      }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-gray-900 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-1.5 bg-slate-800 rounded-full hover:bg-slate-700 text-white transition-colors">
                  <Home className="w-4 h-4" />
              </button>
              <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">MY GAMES</h2>
                  <p className="text-gray-400 text-sm uppercase tracking-wide">CHOOSE SESSION</p>
              </div>
          </div>
          <div className="flex items-center gap-1">
              {onRefresh && (
                  <button 
                    onClick={handleRefresh}
                    className={`p-2 hover:bg-white/20 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
          </div>
        </div>

        {/* Main Toggles */}
        <div className="flex p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setMainView('GAMES')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-wide ${mainView === 'GAMES' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
                <Gamepad2 className="w-4 h-4" /> GAMES
            </button>
            <button
                onClick={() => setMainView('TEMPLATES')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-wide ${mainView === 'TEMPLATES' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
                <LayoutTemplate className="w-4 h-4" /> TEMPLATES
            </button>
        </div>

        {/* GAMES VIEW: Sub Tabs */}
        {mainView === 'GAMES' && (
            <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <button 
                    onClick={() => setSessionTab('TODAY')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative ${sessionTab === 'TODAY' ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Clock className="w-3 h-3" /> TODAY
                    {sessionTab === 'TODAY' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />}
                </button>
                <button 
                    onClick={() => setSessionTab('PLANNED')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative ${sessionTab === 'PLANNED' ? 'text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Calendar className="w-3 h-3" /> PLANNED
                    {sessionTab === 'PLANNED' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
                </button>
                <button 
                    onClick={() => setSessionTab('COMPLETED')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative ${sessionTab === 'COMPLETED' ? 'text-green-600 dark:text-green-400 bg-white dark:bg-gray-800' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <CheckCircle className="w-3 h-3" /> COMPLETED
                    {sessionTab === 'COMPLETED' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
                </button>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {mainView === 'GAMES' && (
                <>
                    <button 
                        onClick={handleCreateBlankGame}
                        className="w-full mb-3 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-400 dark:hover:text-orange-400 font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all bg-white dark:bg-gray-800"
                    >
                        <Plus className="w-5 h-5" /> Create Blank Game
                    </button>

                    {filteredGames.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                                <Gamepad2 className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wide">NO {sessionTab} GAMES FOUND</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredGames.map(game => {
                                const completedCount = game.points.filter(p => p.isCompleted).length;
                                const totalCount = game.points.filter(p => !p.isSectionHeader).length;
                                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                                
                                return (
                                    <div 
                                        key={game.id} 
                                        onClick={() => onSelectGame(game.id)}
                                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 shadow-sm cursor-pointer group transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-white uppercase">{game.name}</h3>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(game.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {onSaveAsTemplate && (
                                                <button 
                                                    onClick={(e) => handleSaveTemplateClick(e, game)}
                                                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                                    title="Save as Template"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-3">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium uppercase">
                                                <MapPin className="w-3 h-3 text-orange-500" />
                                                {totalCount} TASKS
                                            </div>
                                            <div className="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400">
                                                <Trophy className="w-3 h-3" />
                                                {progress}%
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {mainView === 'TEMPLATES' && (
                <div className="space-y-3">
                    {taskLists.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                                <LayoutTemplate className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wide">NO TEMPLATES FOUND</p>
                        </div>
                    ) : (
                        taskLists.map(list => (
                            <button
                                key={list.id}
                                onClick={() => handleCreateFromTemplate(list)}
                                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm text-left group transition-all"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-800 dark:text-white uppercase">{list.name}</h3>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{list.description || 'No description'}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded uppercase tracking-wide">
                                        {list.tasks.length} TASKS
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 uppercase tracking-wide ml-auto group-hover:underline">
                                        <Plus className="w-3 h-3" /> CREATE GAME
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GameChooser;
