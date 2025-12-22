import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Game, GameState, GameMode, GamePoint, Coordinate, 
  MapStyleId, Language, Team, TaskTemplate, TaskList, TaskType 
} from './types';
import * as db from './services/db';
import { teamSync } from './services/teamSync';
import { haversineMeters } from './utils/geo';
import { seedDatabase, seedTeams } from './utils/demoContent';

// Components
import GameMap, { GameMapHandle } from './components/GameMap';
import GameHUD from './components/GameHUD';
import TaskModal from './components/TaskModal';
import GameManager from './components/GameManager';
import GameChooser from './components/GameChooser';
import TaskMaster from './components/TaskMaster';
import EditorDrawer from './components/EditorDrawer';
import WelcomeScreen from './components/WelcomeScreen';
import ResultsView from './components/ResultsView';
import TaskPreview from './components/TaskPreview';
import PlaygroundEditor from './components/PlaygroundEditor';
import PlaygroundLibraryModal from './components/PlaygroundLibraryModal';
import TeamDashboard from './components/TeamDashboard';
import TeamsModal from './components/TeamsModal';
import GameCreator from './components/GameCreator';
import InitialLanding from './components/InitialLanding';
import CreatorHub from './components/CreatorHub';
import TeamsHubModal from './components/TeamsHubModal';
import CreatorDrawer from './components/CreatorDrawer';
import PointContextMenu from './components/PointContextMenu';
import TaskActionModal from './components/TaskActionModal';
import TaskPlaylistModal from './components/TaskPlaylistModal';
import AiTaskGenerator from './components/AiTaskGenerator';
import ClientSubmissionView from './components/ClientSubmissionView';
import MessagePopup from './components/MessagePopup';
import InstructorDashboard from './components/InstructorDashboard';
import GameStats from './components/GameStats';
import Dashboard from './components/Dashboard';
import TaskEditor from './components/TaskEditor'; // Added import for TaskEditor

// Constants
const STORAGE_KEY_GAME_ID = 'geohunt_active_game_id';
const STORAGE_KEY_TEAM_NAME = 'geohunt_team_name';
const STORAGE_KEY_USER_NAME = 'geohunt_user_name';
const STORAGE_KEY_MODE = 'geohunt_mode';

const App: React.FC = () => {
  // --- STATE ---
  const [mode, setMode] = useState<GameMode>(GameMode.PLAY);
  const [gameState, setGameState] = useState<GameState>({
    activeGameId: null,
    games: [],
    taskLibrary: [],
    taskLists: [],
    score: 0,
    userLocation: null,
    gpsAccuracy: null,
    deviceId: teamSync.getDeviceId(),
  });

  const [mapStyle, setMapStyle] = useState<MapStyleId>('osm');
  const [language, setLanguage] = useState<Language>('English');
  const [loading, setLoading] = useState(true);

  // UI Toggles & Modals
  const [showWelcome, setShowWelcome] = useState(true);
  const [showGameManager, setShowGameManager] = useState(false);
  const [showGameChooser, setShowGameChooser] = useState(false);
  const [showTaskMaster, setShowTaskMaster] = useState(false);
  const [showPlaygroundEditor, setShowPlaygroundEditor] = useState(false);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showCreatorHub, setShowCreatorHub] = useState(false);
  const [showGameCreator, setShowGameCreator] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showPlaygroundLibrary, setShowPlaygroundLibrary] = useState(false);
  const [showTeamsHub, setShowTeamsHub] = useState(false);
  const [showTaskPlaylist, setShowTaskPlaylist] = useState(false);
  
  // Editor Specific State
  const [selectedPoint, setSelectedPoint] = useState<GamePoint | null>(null);
  const [editingPoint, setEditingPoint] = useState<GamePoint | null>(null);
  const [sourceListId, setSourceListId] = useState<string>('');
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePathIds, setMeasurePathIds] = useState<string[]>([]);
  const [forceExpandDrawer, setForceExpandDrawer] = useState(false);
  const [taskMasterTab, setTaskMasterTab] = useState<'LISTS' | 'LIBRARY' | 'CREATE' | 'CLIENT' | 'QR'>('LIBRARY');
  const [taskMasterEditingListId, setTaskMasterEditingListId] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'dashboard' | 'games' | 'templates' | 'tasks' | 'users' | 'tags' | 'client'>('dashboard');
  const [showActionModal, setShowActionModal] = useState(false);
  const [isDrawingLogic, setIsDrawingLogic] = useState<{ trigger: 'onOpen' | 'onCorrect' | 'onIncorrect', sourcePointId: string } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ point: GamePoint } | null>(null);

  // Client / External
  const [clientSubmissionToken, setClientSubmissionToken] = useState<string | null>(null);
  const [messagePopup, setMessagePopup] = useState<{ message: string, sender: string } | null>(null);
  const [showInstructorDashboard, setShowInstructorDashboard] = useState(false);

  const mapRef = useRef<GameMapHandle>(null);

  // --- DERIVED STATE ---
  const activeGame = useMemo(() => 
    gameState.games.find(g => g.id === gameState.activeGameId) || null
  , [gameState.games, gameState.activeGameId]);

  const displayPoints = useMemo(() => {
      return activeGame ? activeGame.points : [];
  }, [activeGame]);

  const measurePath = useMemo(() => {
      if (!activeGame) return [];
      return measurePathIds
          .map(id => activeGame.points.find(p => p.id === id)?.location)
          .filter((l): l is Coordinate => !!l);
  }, [activeGame, measurePathIds]);

  const measuredDistance = useMemo(() => {
      let dist = 0;
      for (let i = 0; i < measurePath.length - 1; i++) {
          dist += haversineMeters(measurePath[i], measurePath[i+1]);
      }
      return dist;
  }, [measurePath]);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Check for query params
    const params = new URLSearchParams(window.location.search);
    const submitTo = params.get('submitTo');
    if (submitTo) {
        setClientSubmissionToken(submitTo);
        setLoading(false);
        return;
    }

    const init = async () => {
      const [fetchedGames, fetchedLibrary, fetchedLists] = await Promise.all([
        db.fetchGames(),
        db.fetchLibrary(),
        db.fetchTaskLists()
      ]);

      // Seed if empty
      if (fetchedGames.length === 0 && fetchedLibrary.length === 0) {
          await seedDatabase();
          const seededGames = await db.fetchGames();
          const seededLib = await db.fetchLibrary();
          const seededLists = await db.fetchTaskLists();
          setGameState(prev => ({ ...prev, games: seededGames, taskLibrary: seededLib, taskLists: seededLists }));
      } else {
          setGameState(prev => ({ ...prev, games: fetchedGames, taskLibrary: fetchedLibrary, taskLists: fetchedLists }));
      }

      // Restore session
      const storedGameId = localStorage.getItem(STORAGE_KEY_GAME_ID);
      const storedTeamName = localStorage.getItem(STORAGE_KEY_TEAM_NAME);
      const storedUserName = localStorage.getItem(STORAGE_KEY_USER_NAME);
      const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as GameMode;

      if (storedGameId) {
          setGameState(prev => ({ ...prev, activeGameId: storedGameId, teamName: storedTeamName || undefined, userName: storedUserName || undefined }));
          if (storedTeamName && storedUserName) {
              teamSync.connect(storedGameId, storedTeamName, storedUserName);
              setShowWelcome(false);
          }
      }

      if (storedMode && Object.values(GameMode).includes(storedMode)) {
          setMode(storedMode);
      }

      setLoading(false);
    };

    init();

    // Geolocation
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGameState(prev => ({ ...prev, userLocation: coord, gpsAccuracy: pos.coords.accuracy }));
        teamSync.updateLocation(coord);
      },
      (err) => console.warn("GPS Error", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    // Chat Listener
    const unsubscribeChat = teamSync.subscribeToChat((msg) => {
        if (msg.targetTeamId && msg.targetTeamId !== `team-${gameState.teamName?.replace(/\s+/g, '-').toLowerCase()}-${activeGame?.id}`) return;
        setMessagePopup({ message: msg.message, sender: msg.sender });
    });

    return () => {
        navigator.geolocation.clearWatch(watchId);
        unsubscribeChat();
    };
  }, []);

  const updateActiveGame = (updatedGame: Game) => {
      setGameState(prev => ({
          ...prev,
          games: prev.games.map(g => g.id === updatedGame.id ? updatedGame : g)
      }));
      db.saveGame(updatedGame);
  };

  const handleCreateGame = async (gameData: Partial<Game>, fromListId?: string) => {
      const newGame: Game = {
          id: `game-${Date.now()}`,
          name: gameData.name || 'New Game',
          description: gameData.description || '',
          points: [],
          createdAt: Date.now(),
          client: gameData.client,
          timerConfig: gameData.timerConfig
      };

      if (fromListId) {
          const list = gameState.taskLists.find(l => l.id === fromListId);
          if (list) {
              // Convert templates to points
              newGame.points = list.tasks.map((t, i) => ({
                  ...t,
                  id: `p-${Date.now()}-${i}`,
                  location: { lat: 0, lng: 0 }, // Needs placement
                  radiusMeters: 30,
                  activationTypes: ['radius'],
                  isUnlocked: true,
                  isCompleted: false,
                  order: i
              }));
          }
      }

      await db.saveGame(newGame);
      setGameState(prev => ({ ...prev, games: [...prev.games, newGame], activeGameId: newGame.id }));
      localStorage.setItem(STORAGE_KEY_GAME_ID, newGame.id);
      
      setShowGameCreator(false);
      setShowGameChooser(false);
      setMode(GameMode.EDIT);
  };

  const handleStartGame = (gameId: string, teamName: string, userName: string) => {
      localStorage.setItem(STORAGE_KEY_GAME_ID, gameId);
      localStorage.setItem(STORAGE_KEY_TEAM_NAME, teamName);
      localStorage.setItem(STORAGE_KEY_USER_NAME, userName);
      
      setGameState(prev => ({ ...prev, activeGameId: gameId, teamName, userName }));
      
      const teamId = `team-${teamName.replace(/\s+/g, '-').toLowerCase()}-${gameId}`;
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Register team
      const newTeam: Team = {
          id: teamId,
          gameId,
          name: teamName,
          joinCode,
          score: 0,
          members: [{ name: userName, deviceId: teamSync.getDeviceId() }],
          updatedAt: new Date().toISOString(),
          captainDeviceId: teamSync.getDeviceId(),
          isStarted: true,
          completedPointIds: []
      };
      
      db.registerTeam(newTeam);
      teamSync.connect(gameId, teamName, userName);
      setShowWelcome(false);
  };

  const handleAddTask = (type: 'MANUAL' | 'AI' | 'LIBRARY', playgroundId?: string) => {
      if (!activeGame) return;
      
      const center = mapRef.current?.getCenter() || gameState.userLocation || { lat: 0, lng: 0 };
      
      if (type === 'AI') {
          setShowAiGenerator(true);
      } else if (type === 'LIBRARY') {
          setTaskMasterTab('LIBRARY');
          setShowTaskMaster(true);
      } else {
          // Manual
          const newPoint: GamePoint = {
              id: `p-${Date.now()}`,
              title: 'New Task',
              iconId: 'default',
              location: center,
              radiusMeters: 30,
              activationTypes: ['radius'],
              isUnlocked: true,
              isCompleted: false,
              order: activeGame.points.length,
              points: 100,
              task: { type: 'text', question: 'Edit this question...' },
              playgroundId,
              playgroundPosition: playgroundId ? { x: 50, y: 50 } : undefined
          };
          
          updateActiveGame({ ...activeGame, points: [...activeGame.points, newPoint] });
          setEditingPoint(newPoint);
      }
  };

  // Logic Drawing Handler
  const handlePointClick = (point: GamePoint) => {
      if (isMeasuring) {
          setMeasurePathIds(prev => [...prev, point.id]);
          return;
      }

      if (isDrawingLogic && activeGame) {
          // Complete Logic Connection
          const source = activeGame.points.find(p => p.id === isDrawingLogic.sourcePointId);
          if (source && source.id !== point.id) {
              const newAction = {
                  id: `act-${Date.now()}`,
                  type: 'unlock' as const, // Default to unlock
                  targetId: point.id
              };
              
              const updatedLogic = { ...source.logic };
              const trigger = isDrawingLogic.trigger;
              updatedLogic[trigger] = [...(updatedLogic[trigger] || []), newAction];
              
              const updatedPoints = activeGame.points.map(p => p.id === source.id ? { ...p, logic: updatedLogic } : p);
              updateActiveGame({ ...activeGame, points: updatedPoints });
              
              alert(`Logic Link Created: ${source.title} -> ${point.title}`);
          }
          setIsDrawingLogic(null);
          return;
      }

      if (mode === GameMode.PLAY) {
          setSelectedPoint(point);
      } else {
          // Edit Mode
          setEditingPoint(point);
      }
  };

  if (clientSubmissionToken) {
      return <ClientSubmissionView token={clientSubmissionToken} />;
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-900 text-white font-sans">
      {/* MAP LAYER */}
      <div className="absolute inset-0 z-0">
          {activeGame && (
              <GameMap 
                  ref={mapRef}
                  userLocation={gameState.userLocation}
                  points={displayPoints}
                  mode={mode}
                  mapStyle={mapStyle}
                  selectedPointId={selectedPoint?.id}
                  isRelocating={false}
                  measurePath={measurePath}
                  onPointClick={handlePointClick}
                  onMapClick={(coord) => {
                      if (mode === GameMode.EDIT && !isDrawingLogic && !isMeasuring) {
                          // Optional: Click to add task?
                      }
                  }}
                  onPointMove={(id, loc) => {
                      if (!activeGame) return;
                      const updated = activeGame.points.map(p => p.id === id ? { ...p, location: loc } : p);
                      updateActiveGame({ ...activeGame, points: updated });
                  }}
                  onDeletePoint={(id) => {
                      if (!activeGame) return;
                      updateActiveGame({ ...activeGame, points: activeGame.points.filter(p => p.id !== id) });
                  }}
                  accuracy={gameState.gpsAccuracy}
              />
          )}
      </div>

      {/* HUD LAYER */}
      <GameHUD 
          accuracy={gameState.gpsAccuracy}
          mode={mode}
          toggleMode={() => {
              const nextMode = mode === GameMode.PLAY ? GameMode.EDIT : (mode === GameMode.EDIT ? GameMode.INSTRUCTOR : GameMode.PLAY);
              setMode(nextMode);
              localStorage.setItem(STORAGE_KEY_MODE, nextMode);
          }}
          onOpenGameManager={() => setShowGameManager(true)}
          onOpenTaskMaster={() => { setTaskMasterTab('LIBRARY'); setShowTaskMaster(true); }}
          onOpenTeams={() => setShowTeamsHub(true)}
          mapStyle={mapStyle}
          onSetMapStyle={setMapStyle}
          language={language}
          onBackToHub={() => {
              if (mode === GameMode.EDIT) {
                  setShowDashboard(true);
              } else {
                  setShowWelcome(true);
              }
          }}
          activeGameName={activeGame?.name}
          onOpenInstructorDashboard={() => setShowInstructorDashboard(true)}
          isMeasuring={isMeasuring}
          onToggleMeasure={() => { setIsMeasuring(!isMeasuring); setMeasurePathIds([]); }}
          measuredDistance={measuredDistance}
          playgrounds={activeGame?.playgrounds}
          onOpenPlayground={(id) => setShowPlaygroundEditor(true)} // Or dedicated playground viewer
          onOpenTeamDashboard={() => setShowTeamDashboard(true)}
          onRelocateGame={() => {
              // Implementation for bulk relocation
              const center = mapRef.current?.getCenter();
              if (activeGame && center) {
                  const currentCenter = activeGame.points[0]?.location || center;
                  const latDiff = center.lat - currentCenter.lat;
                  const lngDiff = center.lng - currentCenter.lng;
                  const updatedPoints = activeGame.points.map(p => ({
                      ...p,
                      location: { lat: p.location.lat + latDiff, lng: p.location.lng + lngDiff }
                  }));
                  updateActiveGame({ ...activeGame, points: updatedPoints });
              }
          }}
          isRelocating={false}
          timerConfig={activeGame?.timerConfig}
      />

      {/* OVERLAYS & MODALS */}
      
      {/* 1. Welcome Screen */}
      {showWelcome && (
          <WelcomeScreen 
              games={gameState.games}
              userLocation={gameState.userLocation}
              onStartGame={handleStartGame}
              onSetMapStyle={setMapStyle}
              language={language}
              onSetLanguage={setLanguage}
              onBack={() => setShowWelcome(false)}
              onInstructorLogin={() => {
                  setMode(GameMode.INSTRUCTOR);
                  setShowWelcome(false);
              }}
          />
      )}

      {/* 2. Editor Drawer (Side Panel in Edit Mode) */}
      {mode === GameMode.EDIT && (
        <EditorDrawer 
          onClose={() => setMode(GameMode.PLAY)} 
          activeGame={activeGame}
          activeGameName={activeGame?.name || "No game selected"} 
          points={displayPoints} 
          allPoints={activeGame?.points}
          taskLists={Array.isArray(gameState.taskLists) ? gameState.taskLists : []} 
          games={Array.isArray(gameState.games) ? gameState.games : []}
          onSelectGame={(id) => {
              setGameState(prev => ({ ...prev, activeGameId: id }));
              localStorage.setItem(STORAGE_KEY_GAME_ID, id);
          }}
          onOpenGameChooser={() => setShowGameChooser(true)}
          sourceListId={sourceListId} 
          onSetSourceListId={setSourceListId} 
          onEditPoint={(p) => setEditingPoint(p)} 
          onSelectPoint={(p) => { 
              if (isMeasuring) {
                  setMeasurePathIds(prev => [...prev, p.id]);
              } else {
                  setSelectedPoint(p); 
                  mapRef.current?.jumpTo(p.location); 
              }
          }} 
          onDeletePoint={(id) => { 
              if(!activeGame) return; 
              updateActiveGame({...activeGame, points: activeGame.points.filter(p => p.id !== id)});
          }} 
          onReorderPoints={(pts) => { 
              if(!activeGame) return; 
              updateActiveGame({...activeGame, points: pts});
          }} 
          onClearMap={(ids) => { 
              if(!activeGame) return; 
              const updated = ids ? activeGame.points.filter(p => !ids.includes(p.id)) : [];
              updateActiveGame({...activeGame, points: updated});
          }} 
          onSaveGame={() => activeGame && db.saveGame(activeGame)} 
          onOpenTaskMaster={() => { setTaskMasterTab('LISTS'); setTaskMasterEditingListId(null); setShowTaskMaster(true); }} 
          onFitBounds={() => {
              if (activeGame?.points.length) mapRef.current?.fitBounds(activeGame.points);
          }} 
          onOpenPlaygroundEditor={() => setShowPlaygroundEditor(true)}
          initialExpanded={forceExpandDrawer}
          onAddTask={handleAddTask} 
          userLocation={gameState.userLocation}
          onSearchLocation={(coord) => mapRef.current?.jumpTo(coord)}
        />
      )}

      {/* 3. Task Play Modal (Player View) */}
      {selectedPoint && mode === GameMode.PLAY && (
          <TaskModal 
              point={selectedPoint}
              onClose={() => setSelectedPoint(null)}
              onComplete={(id, score) => {
                  if (activeGame) {
                      const updatedPoints = activeGame.points.map(p => p.id === id ? { ...p, isCompleted: true } : p);
                      updateActiveGame({ ...activeGame, points: updatedPoints });
                      setGameState(prev => ({ ...prev, score: prev.score + (score || 0) }));
                      if (gameState.teamName && activeGame) {
                          // Update remote score
                          const teamId = `team-${gameState.teamName.replace(/\s+/g, '-').toLowerCase()}-${activeGame.id}`;
                          db.updateTeamProgress(teamId, id, gameState.score + (score || 0));
                      }
                  }
              }}
              onPenalty={(amt) => setGameState(prev => ({ ...prev, score: Math.max(0, prev.score - amt) }))}
              distance={haversineMeters(gameState.userLocation, selectedPoint.location)}
              onUnlock={(id) => {
                  if (activeGame) {
                      const updated = activeGame.points.map(p => p.id === id ? { ...p, isUnlocked: true } : p);
                      updateActiveGame({ ...activeGame, points: updated });
                  }
              }}
              mode={mode}
          />
      )}

      {/* 4. Task Editor (Edit Mode) */}
      {editingPoint && mode === GameMode.EDIT && (
          <TaskEditor 
              point={editingPoint}
              onSave={(updated) => {
                  if (activeGame) {
                      const updatedPoints = activeGame.points.map(p => p.id === updated.id ? updated : p);
                      updateActiveGame({ ...activeGame, points: updatedPoints });
                  }
                  setEditingPoint(null);
              }}
              onDelete={(id) => {
                  if (activeGame) {
                      updateActiveGame({ ...activeGame, points: activeGame.points.filter(p => p.id !== id) });
                  }
                  setEditingPoint(null);
              }}
              onClose={() => setEditingPoint(null)}
              onClone={(p) => {
                  if (activeGame) {
                      const clone = { ...p, id: `p-${Date.now()}`, location: { lat: p.location.lat + 0.0001, lng: p.location.lng + 0.0001 }, title: `${p.title} (Copy)` };
                      updateActiveGame({ ...activeGame, points: [...activeGame.points, clone] });
                  }
              }}
          />
      )}

      {/* 5. Playground Editor */}
      {showPlaygroundEditor && activeGame && (
          <PlaygroundEditor 
              game={activeGame}
              onUpdateGame={updateActiveGame}
              onClose={() => setShowPlaygroundEditor(false)}
              onEditPoint={setEditingPoint}
              onAddTask={handleAddTask}
              onOpenLibrary={() => setShowPlaygroundLibrary(true)}
          />
      )}

      {/* 6. Dashboard / Landing */}
      {showDashboard && (
          <Dashboard 
              games={gameState.games}
              taskLists={gameState.taskLists}
              taskLibrary={gameState.taskLibrary}
              onBack={() => setShowDashboard(false)}
              onAction={(action) => {
                  if (action === 'CREATE') { setShowGameCreator(true); }
                  if (action === 'EDIT_GAME') { setShowDashboard(false); setMode(GameMode.EDIT); }
                  if (action === 'VIEW_TEMPLATES') { setTaskMasterTab('LISTS'); setShowTaskMaster(true); }
                  if (action === 'VIEW_TASKS') { setTaskMasterTab('LIBRARY'); setShowTaskMaster(true); }
              }}
              userName={gameState.userName || 'Guest'}
              initialTab={dashboardTab}
              onDeleteTagGlobally={async (tag) => { await db.purgeTagGlobally(tag); }}
              onRenameTagGlobally={async (oldT, newT) => { await db.renameTagGlobally(oldT, newT); }}
          />
      )}

      {/* 7. Task Master (Library) */}
      {showTaskMaster && (
          <TaskMaster 
              library={gameState.taskLibrary}
              lists={gameState.taskLists}
              initialTab={taskMasterTab}
              onClose={() => setShowTaskMaster(false)}
              onSaveTemplate={async (t) => {
                  await db.saveTemplate(t);
                  const lib = await db.fetchLibrary();
                  setGameState(prev => ({ ...prev, taskLibrary: lib }));
              }}
              onDeleteTemplate={async (id) => {
                  await db.deleteTemplate(id);
                  const lib = await db.fetchLibrary();
                  setGameState(prev => ({ ...prev, taskLibrary: lib }));
              }}
              onSaveList={async (l) => {
                  await db.saveTaskList(l);
                  const lists = await db.fetchTaskLists();
                  setGameState(prev => ({ ...prev, taskLists: lists }));
              }}
              onDeleteList={async (id) => {
                  await db.deleteTaskList(id);
                  const lists = await db.fetchTaskLists();
                  setGameState(prev => ({ ...prev, taskLists: lists }));
              }}
              onCreateGameFromList={(id) => {
                  handleCreateGame({ name: 'From Template' }, id);
                  setShowTaskMaster(false);
              }}
              games={gameState.games}
              activeGameId={activeGame?.id}
              onAddTasksToGame={(gid, tasks) => {
                  const targetGame = gameState.games.find(g => g.id === gid);
                  if (targetGame) {
                      const newPoints = tasks.map((t, i) => ({
                          ...t,
                          id: `p-${Date.now()}-${i}`,
                          location: { lat: 0, lng: 0 },
                          radiusMeters: 30,
                          activationTypes: ['radius'],
                          isUnlocked: true,
                          isCompleted: false,
                          order: targetGame.points.length + i
                      } as GamePoint));
                      updateActiveGame({ ...targetGame, points: [...targetGame.points, ...newPoints] });
                  }
              }}
              initialEditingListId={taskMasterEditingListId}
          />
      )}

      {/* 8. Game Chooser */}
      {showGameChooser && (
          <GameChooser 
              games={gameState.games}
              taskLists={gameState.taskLists}
              onSelectGame={(id) => {
                  setGameState(prev => ({ ...prev, activeGameId: id }));
                  localStorage.setItem(STORAGE_KEY_GAME_ID, id);
                  setShowGameChooser(false);
              }}
              onCreateGame={(name, fromId) => handleCreateGame({ name }, fromId)}
              onClose={() => setShowGameChooser(false)}
              onSaveAsTemplate={async (gid, name) => {
                  const g = gameState.games.find(x => x.id === gid);
                  if (g) {
                      const newList: TaskList = {
                          id: `list-${Date.now()}`,
                          name,
                          description: g.description,
                          tasks: g.points.map(p => ({ ...p, id: `tpl-${Date.now()}-${p.id}` })),
                          color: '#3b82f6',
                          createdAt: Date.now()
                      };
                      await db.saveTaskList(newList);
                      const lists = await db.fetchTaskLists();
                      setGameState(prev => ({ ...prev, taskLists: lists }));
                  }
              }}
              onOpenGameCreator={() => setShowGameCreator(true)}
              onRefresh={async () => {
                  const [g, l, t] = await Promise.all([db.fetchGames(), db.fetchTaskLists(), db.fetchLibrary()]);
                  setGameState(prev => ({ ...prev, games: g, taskLists: l, taskLibrary: t }));
              }}
          />
      )}

      {/* 9. Game Creator Modal */}
      {showGameCreator && (
          <GameCreator 
              onClose={() => setShowGameCreator(false)}
              onCreate={handleCreateGame}
          />
      )}

      {/* 10. AI Generator */}
      {showAiGenerator && activeGame && (
          <AiTaskGenerator 
              onClose={() => setShowAiGenerator(false)}
              onAddTasks={(tasks) => {
                  const newPoints = tasks.map((t, i) => ({
                      ...t,
                      id: `p-${Date.now()}-${i}`,
                      location: mapRef.current?.getCenter() || { lat: 0, lng: 0 },
                      radiusMeters: 30,
                      activationTypes: ['radius'],
                      isUnlocked: true,
                      isCompleted: false,
                      order: activeGame.points.length + i,
                      points: 100
                  } as GamePoint));
                  updateActiveGame({ ...activeGame, points: [...activeGame.points, ...newPoints] });
              }}
          />
      )}

      {/* 11. Instructor Dashboard */}
      {showInstructorDashboard && activeGame && (
          <InstructorDashboard 
              game={activeGame}
              onClose={() => setShowInstructorDashboard(false)}
          />
      )}

      {/* 12. Team Dashboard */}
      {showTeamDashboard && activeGame && (
          <TeamDashboard 
              gameId={activeGame.id}
              teamId={`team-${gameState.teamName?.replace(/\s+/g, '-').toLowerCase()}-${activeGame.id}`}
              totalMapPoints={activeGame.points.length}
              onOpenAgents={() => setShowTeamsModal(true)}
              onClose={() => setShowTeamDashboard(false)}
          />
      )}

      {/* 13. Teams Hub */}
      {showTeamsHub && (
          <TeamsHubModal 
              onClose={() => setShowTeamsHub(false)}
              onAction={(action) => {
                  setShowTeamsHub(false);
                  if (action === 'JOIN') setShowWelcome(true);
                  if (action === 'COMMAND') setShowTeamsModal(true);
              }}
          />
      )}

      {/* 14. Teams Management Modal */}
      {showTeamsModal && (
          <TeamsModal 
              gameId={activeGame?.id || null}
              games={gameState.games}
              onClose={() => setShowTeamsModal(false)}
              onSelectGame={(id) => {
                  setGameState(prev => ({ ...prev, activeGameId: id }));
                  localStorage.setItem(STORAGE_KEY_GAME_ID, id);
              }}
          />
      )}

      {/* 15. Playground Library Import */}
      {showPlaygroundLibrary && activeGame && (
          <PlaygroundLibraryModal 
              onClose={() => setShowPlaygroundLibrary(false)}
              onImport={(tpl) => {
                  const newPG = { ...tpl.playgroundData, id: `pg-${Date.now()}` };
                  const newTasks = tpl.tasks.map(t => ({ 
                      ...t, 
                      id: `p-${Date.now()}-${Math.random()}`, 
                      playgroundId: newPG.id 
                  }));
                  updateActiveGame({ 
                      ...activeGame, 
                      playgrounds: [...(activeGame.playgrounds || []), newPG],
                      points: [...activeGame.points, ...newTasks]
                  });
                  setShowPlaygroundLibrary(false);
              }}
          />
      )}

      {/* Message Popup */}
      {messagePopup && (
          <MessagePopup 
              message={messagePopup.message} 
              sender={messagePopup.sender} 
              onClose={() => setMessagePopup(null)} 
          />
      )}

      {/* Stats Overlay */}
      {activeGame && mode === GameMode.PLAY && (
          <GameStats 
              score={gameState.score} 
              pointsCount={{ 
                  total: activeGame.points.filter(p => !p.isSectionHeader).length, 
                  completed: activeGame.points.filter(p => p.isCompleted).length 
              }}
              nearestPointDistance={0} // calculated in HUD/Map if needed
              language={language}
          />
      )}

    </div>
  );
};

export default App;