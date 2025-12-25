import React, { useState, useMemo, useRef } from 'react';
import { Game, TaskList, GamePoint } from '../types';
import { X, Calendar, CheckCircle, Play, MapPin, ChevronRight, Trophy, LayoutTemplate, Gamepad2, Save, RefreshCw, Home, Plus, Zap, Clock, AlertTriangle, Search, Filter, MoreHorizontal, Settings, Edit2, LayoutList, Trash2, Check, Upload, Image as ImageIcon, LayoutGrid, Layers, Grid, List as ListIcon, Map } from 'lucide-react';

interface GameChooserProps {
  games: Game[];
  taskLists: TaskList[];
  onSelectGame: (id: string) => void;
  onCreateGame: (name: string, fromTaskListId?: string) => void;
  onClose: () => void;
  onSaveAsTemplate?: (gameId: string, name: string) => void;
  onRefresh?: () => void;
  onOpenGameCreator?: () => void;
  onEditGame?: (id: string) => void; 
  onEditTemplate?: (id: string) => void; 
  onUpdateList?: (list: TaskList) => Promise<void>; 
  onDeleteList?: (id: string) => Promise<void>; 
  onEditTemplateContent?: (templateId: string) => void;
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
  onRefresh,
  onOpenGameCreator,
  onEditGame,
  onEditTemplate,
  onUpdateList,
  onDeleteList,
  onEditTemplateContent
}) => {
  const [mainView, setMainView] = useState<MainView>('GAMES');
  const [sessionTab, setSessionTab] = useState<SessionTab>('TODAY');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  
  const [editingTemplate, setEditingTemplate] = useState<TaskList | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', imageUrl: '' });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputModal, setInputModal] = useState<{
      isOpen: boolean;
      title: string;
      defaultValue: string;
      onConfirm: (val: string) => void;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const openInputModal = (title: string, defaultValue: string, onConfirm: (val: string) => void) => {
      setInputValue(defaultValue);
      setInputModal({ isOpen: true, title, defaultValue, onConfirm });
  };

  const filteredGames = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let result = games;

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(g => g.name.toLowerCase().includes(q));
    }

    const checkCompletion = (game: Game) => {
        if (!game.points || game.points.length === 0) return false;
        return game.points.every(p => p.isCompleted);
    };

    return result.filter(g => {
        const dateStr = g.client?.playingDate || g.createdAt;
        const gDate = new Date(dateStr);
        gDate.setHours(0, 0, 0, 0);
        
        const isFinished = checkCompletion(g);
        const isOverdue = gDate.getTime() < today.getTime();
        const isToday = gDate.getTime() === today.getTime();
        const isFuture = gDate.getTime() > today.getTime();

        if (sessionTab === 'COMPLETED') return isFinished || isOverdue;
        if (isFinished || isOverdue) return false;
        if (sessionTab === 'TODAY') return isToday;
        if (sessionTab === 'PLANNED') return isFuture;
        
        return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [games, sessionTab, searchQuery]);

  const filteredTemplates = useMemo(() => {
      let result = taskLists;
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          result = result.filter(t => t.name.toLowerCase().includes(q));
      }
      return result;
  }, [taskLists, searchQuery]);

  const handleCreateFromTemplate = (list: TaskList) => {
      openInputModal(
          `Name for new game based on "${list.name}"`,
          list.name,
          (name) => onCreateGame(name, list.id)
      );
  };

  const handleCreateBlankGame = () => {
      if (onOpenGameCreator) {
          onOpenGameCreator();
      } else {
          openInputModal(
              "Name for new empty game",
              "New Game",
              (name) => onCreateGame(name)
          );
      }
  };

  const handleSaveTemplateClick = (e: React.MouseEvent, game: Game) => {
      e.stopPropagation();
      if (!onSaveAsTemplate) return;
      openInputModal(
          "Enter a name for this new template",
          `${game.name} Template`,
          (name) => onSaveAsTemplate(game.id, name)
      );
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openTemplateDetails = (list: TaskList) => {
      setEditingTemplate(list);
      setTemplateForm({
          name: list.name,
          description: list.description,
          imageUrl: list.imageUrl || ''
      });
      setIsDeleteConfirming(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTemplateForm(prev => ({ ...prev, imageUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const saveTemplateChanges = async () => {
      if (!editingTemplate || !onUpdateList) return;
      setIsSavingTemplate(true);
      
      const updatedList: TaskList = {
          ...editingTemplate,
          name: templateForm.name,
          description: templateForm.description,
          imageUrl: templateForm.imageUrl
      };

      await onUpdateList(updatedList);
      setIsSavingTemplate(false);
      setEditingTemplate(null); 
  };

  const performDeleteTemplate = async () => {
      if (!editingTemplate || !onDeleteList) return;
      await onDeleteList(editingTemplate.id);
      setEditingTemplate(null);
      setIsDeleteConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-950 text-white flex flex-col font-sans overflow-hidden animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e293b,transparent)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

      {/* Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center shrink-0 shadow-xl z-20 gap-4">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                  <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase leading-none">GAME SESSIONS</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">SELECT OR CREATE A MISSION</p>
              </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={mainView === 'GAMES' ? "SEARCH GAMES..." : "SEARCH TEMPLATES..."} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500 transition-all uppercase placeholder-slate-600 focus:ring-1 focus:ring-orange-500/50"
                  />
              </div>

              {/* View Toggle */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                      <Grid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                      <ListIcon className="w-4 h-4" />
                  </button>
              </div>
              
              <div className="flex gap-2">
                  {onRefresh && (
                      <button 
                        onClick={handleRefresh}
                        className={`p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors hover:scale-105 active:scale-95 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
                        title="Refresh Data"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                  )}
                  <button onClick={onClose} className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors hover:scale-105 active:scale-95">
                    <X className="w-5 h-5" />
                  </button>
              </div>
          </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex justify-center shrink-0 z-10">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                  onClick={() => setMainView('GAMES')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${mainView === 'GAMES' ? 'bg-orange-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              >
                  <Gamepad2 className="w-4 h-4" /> GAMES
              </button>
              <button
                  onClick={() => setMainView('TEMPLATES')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${mainView === 'TEMPLATES' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              >
                  <LayoutTemplate className="w-4 h-4" /> TEMPLATES
              </button>
          </div>
      </div>

      {/* Sub Tabs (Games Only) */}
      {mainView === 'GAMES' && (
          <div className="bg-slate-900/50 border-b border-slate-800 px-6 flex justify-center shrink-0 z-10 backdrop-blur-sm">
              <div className="flex gap-8">
                  {[
                      { id: 'TODAY', label: 'TODAY', icon: Clock, color: 'text-orange-500' },
                      { id: 'PLANNED', label: 'PLANNED', icon: Calendar, color: 'text-amber-500' },
                      { id: 'COMPLETED', label: 'COMPLETED', icon: CheckCircle, color: 'text-green-500' }
                  ].map(tab => (
                      <button
                          key={tab.id}
                          onClick={() => setSessionTab(tab.id as SessionTab)}
                          className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 transition-all hover:text-white ${sessionTab === tab.id ? `border-current ${tab.color} scale-105` : 'border-transparent text-slate-500'}`}
                      >
                          <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-0">
          <div className="max-w-[1920px] mx-auto">
              
              {mainView === 'GAMES' && (
                  <>
                      {sessionTab !== 'COMPLETED' && (
                          <div className="mb-8">
                              <button 
                                  onClick={handleCreateBlankGame}
                                  className="w-full py-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-500/5 transition-all group hover:scale-[1.01]"
                              >
                                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all group-hover:scale-110">
                                      <Plus className="w-5 h-5" />
                                  </div>
                                  <span className="font-black uppercase tracking-widest text-sm">CREATE NEW GAME SESSION</span>
                              </button>
                          </div>
                      )}

                      {filteredGames.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                              <Gamepad2 className="w-16 h-16 mb-4 opacity-20" />
                              <p className="font-black uppercase tracking-[0.2em] text-sm">NO {sessionTab} GAMES FOUND</p>
                          </div>
                      ) : (
                          <div className={viewMode === 'GRID' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" : "space-y-3"}>
                              {filteredGames.map(game => {
                                  const completedCount = game.points.filter(p => p.isCompleted).length;
                                  const totalCount = game.points.filter(p => !p.isSectionHeader).length;
                                  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                                  const gameDate = game.client?.playingDate ? new Date(game.client.playingDate) : new Date(game.createdAt);

                                  if (viewMode === 'LIST') {
                                      // LIST VIEW ROW
                                      return (
                                          <div 
                                              key={game.id}
                                              onClick={() => onSelectGame(game.id)}
                                              className="group flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-orange-500/50 p-3 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-orange-500/10 hover:translate-x-1"
                                          >
                                              <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden relative shrink-0 border border-slate-700 group-hover:border-orange-500/30 transition-colors">
                                                  {game.client?.logoUrl ? (
                                                      <img src={game.client.logoUrl} className="w-full h-full object-contain p-2 bg-white" alt="Logo" />
                                                  ) : (
                                                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40"><Gamepad2 className="w-6 h-6"/></div>
                                                  )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                  <h3 className="font-black text-white text-sm uppercase truncate group-hover:text-orange-500 transition-colors">{game.name}</h3>
                                                  <div className="flex items-center gap-3 mt-1">
                                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                          <Calendar className="w-3 h-3" /> {gameDate.toLocaleDateString()}
                                                      </span>
                                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                                          <MapPin className="w-3 h-3" /> {totalCount} TASKS
                                                      </span>
                                                  </div>
                                              </div>
                                              
                                              {/* Actions in List View */}
                                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  {onEditGame && (
                                                      <button onClick={(e) => { e.stopPropagation(); onEditGame(game.id); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                          <Settings className="w-4 h-4" />
                                                      </button>
                                                  )}
                                              </div>

                                              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shrink-0">
                                                  <Play className="w-4 h-4 ml-0.5" />
                                              </div>
                                          </div>
                                      );
                                  }

                                  // GRID VIEW CARD
                                  return (
                                      <div 
                                          key={game.id}
                                          onClick={() => onSelectGame(game.id)}
                                          className="group relative bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-orange-500/10 cursor-pointer flex flex-col h-[280px]"
                                      >
                                          {/* Card Image */}
                                          <div className="h-32 bg-slate-800 relative overflow-hidden group-hover:brightness-110 transition-all">
                                              {game.client?.logoUrl ? (
                                                  <img src={game.client.logoUrl} className="w-full h-full object-contain p-4 bg-white" alt="Logo" />
                                              ) : (
                                                  <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                                      <Gamepad2 className="w-16 h-16" />
                                                  </div>
                                              )}
                                              
                                              {onSaveAsTemplate && (
                                                  <button 
                                                      onClick={(e) => handleSaveTemplateClick(e, game)}
                                                      className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 z-10"
                                                      title="Save as Template"
                                                  >
                                                      <Save className="w-4 h-4" />
                                                  </button>
                                              )}

                                              {onEditGame && (
                                                  <button 
                                                      onClick={(e) => { e.stopPropagation(); onEditGame(game.id); }}
                                                      className="absolute top-2 left-2 p-2 bg-slate-900/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100 z-10"
                                                      title="Edit Game Settings"
                                                  >
                                                      <Settings className="w-4 h-4" />
                                                  </button>
                                              )}
                                          </div>

                                          {/* Card Content */}
                                          <div className="p-5 flex-1 flex flex-col justify-between relative">
                                              <div>
                                                  <div className="flex justify-between items-start mb-1">
                                                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{game.client?.name || 'PRIVATE GAME'}</span>
                                                      <span className="text-[9px] font-bold text-slate-600 uppercase">{gameDate.toLocaleDateString()}</span>
                                                  </div>
                                                  <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors">
                                                      {game.name}
                                                  </h3>
                                                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {totalCount} TASKS</span>
                                                      {game.playgrounds && game.playgrounds.length > 0 && (
                                                          <span className="flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> {game.playgrounds.length} ZONES</span>
                                                      )}
                                                  </div>
                                              </div>

                                              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                                                  <div className="flex items-center gap-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                                      {progress > 0 ? `${progress}% COMPLETE` : 'READY TO START'}
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest group-hover:text-orange-500 transition-colors">
                                                      ENTER LOBBY <ChevronRight className="w-3 h-3" />
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </>
              )}

              {mainView === 'TEMPLATES' && (
                  <>
                      {filteredTemplates.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                              <LayoutTemplate className="w-16 h-16 mb-4 opacity-20" />
                              <p className="font-black uppercase tracking-[0.2em] text-sm">NO TEMPLATES FOUND</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                              {filteredTemplates.map(list => (
                                  <div 
                                      key={list.id} 
                                      className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-blue-500/10 cursor-pointer flex flex-col h-[280px]"
                                      onClick={() => openTemplateDetails(list)}
                                  >
                                      <div className="h-32 bg-slate-800 relative overflow-hidden group-hover:brightness-110 transition-all">
                                          {list.imageUrl ? (
                                              <img src={list.imageUrl} className="w-full h-full object-cover" alt={list.name} />
                                          ) : (
                                              <div className="absolute inset-0 flex items-center justify-center opacity-20" style={{ backgroundColor: list.color || '#3b82f6' }}>
                                                  <LayoutList className="w-12 h-12 text-white" />
                                              </div>
                                          )}
                                          
                                          {/* Hover Overlay Actions */}
                                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); handleCreateFromTemplate(list); }}
                                                  className="p-3 bg-green-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                                                  title="Create Game from this Template"
                                              >
                                                  <Play className="w-5 h-5 ml-0.5" />
                                              </button>
                                              {onEditTemplateContent && (
                                                  <button 
                                                      onClick={(e) => { e.stopPropagation(); onEditTemplateContent(list.id); }}
                                                      className="p-3 bg-orange-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                                                      title="Edit Template Content (Ghost Game)"
                                                  >
                                                      <Edit2 className="w-5 h-5" />
                                                  </button>
                                              )}
                                          </div>
                                      </div>

                                      <div className="p-5 flex-1 flex flex-col justify-between">
                                          <div>
                                              <div className="flex justify-between items-start mb-1">
                                                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">TEMPLATE</span>
                                                  <span className="text-[9px] font-bold text-slate-600 uppercase">{list.tasks.length} TASKS</span>
                                              </div>
                                              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                                                  {list.name}
                                              </h3>
                                              <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                  {list.description || "No description provided."}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </>
              )}
          </div>
      </div>

      {/* Input Modal */}
      {inputModal && inputModal.isOpen && (
          <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">{inputModal.title}</h3>
                  <input 
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-orange-500 mb-6 uppercase"
                      autoFocus
                  />
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setInputModal(null)} 
                          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs"
                      >
                          CANCEL
                      </button>
                      <button 
                          onClick={() => { inputModal.onConfirm(inputValue); setInputModal(null); }} 
                          disabled={!inputValue.trim()}
                          className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50"
                      >
                          CONFIRM
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Template Details / Edit Modal */}
      {editingTemplate && (
          <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                      <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">TEMPLATE DETAILS</h2>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">ID: {editingTemplate.id}</p>
                      </div>
                      <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <div className="flex flex-col md:flex-row gap-8 mb-8">
                          <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full md:w-48 aspect-video md:aspect-square bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all relative overflow-hidden group shrink-0"
                          >
                              {templateForm.imageUrl ? (
                                  <>
                                      <img src={templateForm.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Upload className="w-6 h-6 text-white" />
                                      </div>
                                  </>
                              ) : (
                                  <div className="text-center text-slate-500 group-hover:text-blue-500 transition-colors">
                                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                      <span className="text-[10px] font-black uppercase tracking-wide">UPLOAD IMAGE</span>
                                  </div>
                              )}
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </div>

                          <div className="flex-1 space-y-4">
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">TEMPLATE NAME</label>
                                  <input 
                                      type="text" 
                                      value={templateForm.name}
                                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-500 transition-all"
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">DESCRIPTION</label>
                                  <textarea 
                                      value={templateForm.description}
                                      onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-medium outline-none focus:border-blue-500 transition-all h-24 resize-none"
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-800 mb-8">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">INCLUDED TASKS ({editingTemplate.tasks.length})</h3>
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                              {editingTemplate.tasks.map((task, idx) => (
                                  <div key={idx} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                                      <span className="text-[10px] font-mono text-slate-500">{(idx + 1).toString().padStart(2, '0')}</span>
                                      <span className="text-xs font-bold text-slate-300 truncate flex-1">{task.title}</span>
                                      <span className="text-[9px] font-black text-slate-600 uppercase bg-slate-900 px-2 py-0.5 rounded">{task.task.type}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {isDeleteConfirming ? (
                          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center animate-in zoom-in-95">
                              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                              <h3 className="text-lg font-black text-white uppercase tracking-wide mb-2">DELETE TEMPLATE?</h3>
                              <p className="text-xs text-slate-400 font-medium mb-6">This action cannot be undone.</p>
                              <div className="flex gap-3 justify-center">
                                  <button onClick={() => setIsDeleteConfirming(false)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs hover:bg-slate-700">CANCEL</button>
                                  <button onClick={performDeleteTemplate} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-red-700 shadow-lg">CONFIRM DELETE</button>
                              </div>
                          </div>
                      ) : (
                          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                              <button onClick={() => setIsDeleteConfirming(true)} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-wide px-4 py-2 hover:bg-red-900/10 rounded-lg">
                                  <Trash2 className="w-4 h-4" /> DELETE TEMPLATE
                              </button>
                              <button onClick={saveTemplateChanges} disabled={isSavingTemplate} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-50">
                                  {isSavingTemplate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} SAVE CHANGES
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GameChooser;