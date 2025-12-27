
import React, { useState, useEffect, useRef } from 'react';
import { Game, GamePoint, TaskList, TaskTemplate, AuthUser, GameMode, Coordinate, MapStyleId, DangerZone, GameRoute, Team, ChatMessage } from './types';
import * as db from './services/db';
import { authService } from './services/auth';
import { teamSync } from './services/teamSync';
import { LocationProvider, useLocation } from './contexts/LocationContext';
import GameMap, { GameMapHandle } from './components/GameMap';
import GameHUD from './components/GameHUD';
import GameManager from './components/GameManager';
import TaskMaster from './components/TaskMaster';
import TeamsModal from './components/TeamsModal';
import InstructorDashboard from './components/InstructorDashboard';
import TeamDashboard from './components/TeamDashboard';
import WelcomeScreen from './components/WelcomeScreen';
import InitialLanding from './components/InitialLanding';
import LoginPage from './components/LoginPage';
import EditorDrawer from './components/EditorDrawer';
import TaskModal from './components/TaskModal';
import DeleteGamesModal from './components/DeleteGamesModal';
import PlaygroundManager from './components/PlaygroundManager';
import AdminModal from './components/AdminModal';
import ChatDrawer from './components/ChatDrawer';
import TeamsHubModal from './components/TeamsHubModal';
import ClientSubmissionView from './components/ClientSubmissionView';
import GameCreator from './components/GameCreator';
import TaskActionModal from './components/TaskActionModal';
import PlaygroundEditor from './components/PlaygroundEditor';
import MessagePopup from './components/MessagePopup';
import Dashboard from './components/Dashboard';

// Inner App Component that consumes LocationContext
const GameApp: React.FC = () => {
  // --- AUTH & USER STATE ---
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // --- DATA STATE ---
  const [games, setGames] = useState<Game[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [taskLibrary, setTaskLibrary] = useState<TaskTemplate[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  // --- UI STATE ---
  const [mode, setMode] = useState<GameMode>(GameMode.PLAY);
  const [showLanding, setShowLanding] = useState(true);
  const [showGameChooser, setShowGameChooser] = useState(false);
  const [showTaskMaster, setShowTaskMaster] = useState(false);
  const [taskMasterInitialTab, setTaskMasterInitialTab] = useState<'LIBRARY' | 'LISTS' | 'TAGS' | 'CLIENT'>('LIBRARY');
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showInstructorDashboard, setShowInstructorDashboard] = useState(false);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);
  const [showDeleteGames, setShowDeleteGames] = useState(false);
  const [showPlaygroundManager, setShowPlaygroundManager] = useState(false);
  const [showDatabaseTools, setShowDatabaseTools] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showTeamsHub, setShowTeamsHub] = useState(false);
  const [showGameCreator, setShowGameCreator] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  
  // --- DASHBOARD STATE ---
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'dashboard' | 'games' | 'templates' | 'tasks' | 'users' | 'tags' | 'client'>('dashboard');

  // --- EDITOR STATE ---
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [activeTask, setActiveTask] = useState<GamePoint | null>(null);
  const [viewingPlaygroundId, setViewingPlaygroundId] = useState<string | null>(null);
  const [playgroundTemplateToEdit, setPlaygroundTemplateToEdit] = useState<any>(null);
  const [activeTaskActionPoint, setActiveTaskActionPoint] = useState<GamePoint | null>(null);
  
  // --- PLAY STATE (Location from Context) ---
  const { userLocation, gpsAccuracy } = useLocation();
  const [activeTaskModal, setActiveTaskModal] = useState<GamePoint | null>(null);
  const [score, setScore] = useState(0);
  const [showScores, setShowScores] = useState(false);
  const [currentDangerZone, setCurrentDangerZone] = useState<DangerZone | null>(null);
  const [activeDangerZone, setActiveDangerZone] = useState<DangerZone | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);
  
  // --- MAP STATE ---
  const [localMapStyle, setLocalMapStyle] = useState<MapStyleId>('osm');
  const mapRef = useRef<GameMapHandle>(null);
  const [isRelocating, setIsRelocating] = useState(false);
  
  // --- MEASUREMENT ---
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePath, setMeasurePath] = useState<Coordinate[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState(0);
  const [measurePointsCount, setMeasurePointsCount] = useState(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      // Force reset login state on mount just in case
      setShowLogin(false);
      
      const user = authService.getCurrentUser();
      if (user) {
        setAuthUser(user);
      }
      const loadedGames = await db.fetchGames();
      setGames(loadedGames);
      const loadedLists = await db.fetchTaskLists();
      setTaskLists(loadedLists);
      const loadedLib = await db.fetchLibrary();
      setTaskLibrary(loadedLib);
    };
    init();
  }, []);

  // Measurement logic updates when userLocation changes
  useEffect(() => {
      if (isMeasuring && userLocation) {
          setMeasurePath(prev => {
              if (prev.length === 0) return [userLocation];
              return [...prev.slice(0, prev.length - 1), userLocation];
          });
          // Note: Actual distance calculation logic would be here
      }
  }, [userLocation, isMeasuring]);

  useEffect(() => {
      if (activeGameId) {
          const game = games.find(g => g.id === activeGameId) || null;
          setActiveGame(game);
          if (game?.defaultMapStyle) setLocalMapStyle(game.defaultMapStyle);
      }
  }, [activeGameId, games]);

  const ensureSession = (callback: () => void) => {
      if (!authUser) {
          setShowLogin(true);
      } else {
          callback();
      }
  };

  const updateActiveGame = async (updatedGame: Game) => {
      await db.saveGame(updatedGame);
      setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
      if (activeGameId === updatedGame.id) {
          setActiveGame(updatedGame);
      }
  };

  const handleDeleteGame = async (id: string) => {
      await db.deleteGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
      if (activeGameId === id) {
          setActiveGameId(null);
          setActiveGame(null);
      }
  };

  const handleDeleteItem = async (pointId: string) => {
      if (!activeGame) return;
      const updatedPoints = activeGame.points.filter(p => p.id !== pointId);
      const updatedZones = (activeGame.dangerZones || []).filter(z => z.id !== pointId);
      await updateActiveGame({ ...activeGame, points: updatedPoints, dangerZones: updatedZones });
      if (activeTask?.id === pointId) setActiveTask(null);
  };

  const handlePointClick = (point: GamePoint) => {
      if (mode === GameMode.EDIT) {
          setActiveTask(point);
      } else if (mode === GameMode.PLAY || mode === GameMode.INSTRUCTOR) {
          setActiveTaskModal(point);
      }
  };

  const handleMapClick = (coord: Coordinate) => {
      if (mode === GameMode.EDIT && isMeasuring) {
          setMeasurePath(prev => [...prev, coord]);
      }
  };

  const handleStartGame = (gameId: string, teamName: string, userName: string, teamPhoto: string | null, style: MapStyleId) => {
      setActiveGameId(gameId);
      setLocalMapStyle(style);
      teamSync.connect(gameId, teamName, userName);
      setMode(GameMode.PLAY);
      setShowLanding(false);
  };

  const handleRelocateGame = () => {
      setIsRelocating(!isRelocating);
  };

  const handleToggleMeasure = () => {
      setIsMeasuring(!isMeasuring);
      if (!isMeasuring) setMeasurePath(userLocation ? [userLocation] : []);
      else setMeasurePath([]);
  };

  const handleLocateMe = () => {
      if (userLocation && mapRef.current) {
          mapRef.current.jumpTo(userLocation);
      }
  };

  const handleAddDangerZone = () => {
      if (!activeGame || !mapRef.current) return;
      const center = mapRef.current.getCenter();
      const newZone: DangerZone = {
          id: `dz-${Date.now()}`,
          location: center,
          radius: 50,
          penalty: 50,
          duration: 10,
          title: 'NEW ZONE',
          penaltyType: 'fixed'
      };
      updateActiveGame({ ...activeGame, dangerZones: [...(activeGame.dangerZones || []), newZone] });
  };

  const handleUpdateRoute = (id: string, updates: Partial<GameRoute>) => {
      if (!activeGame) return;
      const updatedRoutes = (activeGame.routes || []).map(r => r.id === id ? { ...r, ...updates } : r);
      updateActiveGame({ ...activeGame, routes: updatedRoutes });
  };

  // Check for Client Submission URL
  const urlParams = new URLSearchParams(window.location.search);
  const submissionToken = urlParams.get('submitTo');
  if (submissionToken) {
      return <ClientSubmissionView token={submissionToken} />;
  }

  if (showLogin) {
      return (
          <LoginPage 
              onLoginSuccess={(user) => { setAuthUser(user); setShowLogin(false); }}
              onPlayAsGuest={() => { setAuthUser({ id: 'guest', name: 'Guest', email: '', role: 'Editor' }); setShowLogin(false); }}
              onBack={() => setShowLogin(false)}
          />
      );
  }

  const renderModals = () => (
      <>
          {showDashboard && (
              <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md animate-in fade-in">
                  <Dashboard 
                      games={games}
                      taskLists={taskLists}
                      taskLibrary={taskLibrary}
                      onBack={() => setShowDashboard(false)}
                      onAction={(action) => {
                          if (action === 'CREATE') {
                              setShowDashboard(false);
                              setGameToEdit(null);
                              setShowGameCreator(true);
                          }
                          // Add other actions as needed
                      }}
                      onSelectGame={(id) => {
                          setActiveGameId(id);
                          setShowDashboard(false);
                          setShowLanding(false);
                          setMode(GameMode.EDIT);
                      }}
                      userName={authUser?.name || 'Admin'}
                      initialTab={dashboardTab}
                  />
              </div>
          )}

          {showGameChooser && (
              <GameManager 
                  games={games}
                  taskLists={taskLists}
                  activeGameId={activeGameId}
                  activeGamePoints={activeGame?.points || []}
                  onCreateGame={async (name, listId, desc, style) => {
                      const newGame: Game = {
                          id: `game-${Date.now()}`,
                          name,
                          description: desc || '',
                          createdAt: Date.now(),
                          points: [],
                          defaultMapStyle: style
                      };
                      await db.saveGame(newGame);
                      setGames([...games, newGame]);
                      setActiveGameId(newGame.id);
                      setMode(GameMode.EDIT);
                      setShowGameChooser(false);
                      setShowLanding(false);
                  }}
                  onSelectGame={(id) => { setActiveGameId(id); setShowGameChooser(false); }}
                  onDeleteGame={handleDeleteGame}
                  onClose={() => setShowGameChooser(false)}
                  onEditGame={(id) => { setActiveGameId(id); setMode(GameMode.EDIT); setShowGameChooser(false); setShowLanding(false); }}
                  onEditPoint={setActiveTask}
                  onReorderPoints={() => {}}
                  onCreateTestGame={() => {}}
                  onOpenTaskMaster={() => setShowTaskMaster(true)}
                  onClearMap={() => updateActiveGame({ ...activeGame!, points: [] })}
                  mode={mode}
                  onSetMode={setMode}
              />
          )}

          {activeTask && (
              <TaskModal 
                  point={activeTask}
                  distance={0}
                  onClose={() => setActiveTask(null)}
                  onComplete={() => {}}
                  mode={mode}
                  isInstructorMode={mode === GameMode.INSTRUCTOR}
                  onOpenActions={() => setActiveTaskActionPoint(activeTask)}
              />
          )}
          {activeTaskModal && (
              <TaskModal
                  point={activeTaskModal}
                  distance={0}
                  onClose={() => setActiveTaskModal(null)}
                  onComplete={(id, pts) => { setScore(s => s + (pts || 0)); setActiveTaskModal(null); }}
                  mode={mode}
                  isInstructorMode={mode === GameMode.INSTRUCTOR}
              />
          )}
          {showTaskMaster && (
              <TaskMaster 
                  initialTab={taskMasterInitialTab}
                  onClose={() => setShowTaskMaster(false)}
                  onImportTasks={async (tasks) => {
                      if (activeGame) {
                          const newPoints = tasks.map(t => ({
                              ...t,
                              id: `p-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
                              location: mapRef.current?.getCenter() || { lat: 0, lng: 0 },
                              radiusMeters: 30,
                              activationTypes: ['radius'],
                              isUnlocked: true,
                              isCompleted: false,
                              order: activeGame.points.length
                          } as GamePoint));
                          await updateActiveGame({ ...activeGame, points: [...activeGame.points, ...newPoints] });
                          setShowTaskMaster(false);
                      }
                  }}
                  taskLists={taskLists}
                  onUpdateTaskLists={setTaskLists}
                  games={games}
              />
          )}
          {showGameCreator && (
              <GameCreator 
                  onClose={() => setShowGameCreator(false)}
                  onCreate={async (gameData) => {
                      if (gameToEdit && gameToEdit.id === gameData.id) {
                          await updateActiveGame({ ...gameToEdit, ...gameData });
                      } else {
                          const newGame = { ...gameData, id: `game-${Date.now()}`, points: [], createdAt: Date.now() } as Game;
                          await db.saveGame(newGame);
                          setGames([...games, newGame]);
                          setActiveGameId(newGame.id);
                          setShowGameChooser(true);
                      }
                      setShowGameCreator(false);
                      setGameToEdit(null);
                  }}
                  baseGame={gameToEdit || undefined}
                  onDelete={handleDeleteGame}
              />
          )}
          {showTeamsHub && (
              <TeamsHubModal 
                  onClose={() => setShowTeamsHub(false)}
                  onAction={(action) => {
                      if (action === 'JOIN') {
                          setMode(GameMode.PLAY);
                          setShowLanding(false);
                          setShowTeamsHub(false);
                      } else {
                          setShowTeamsModal(true);
                          setShowTeamsHub(false);
                      }
                  }}
              />
          )}
          {showTeamsModal && (
              <TeamsModal 
                  gameId={activeGameId}
                  games={games}
                  onSelectGame={setActiveGameId}
                  onClose={() => setShowTeamsModal(false)}
                  isAdmin={true}
              />
          )}
          {showInstructorDashboard && activeGame && (
              <InstructorDashboard 
                  game={activeGame}
                  onClose={() => setShowInstructorDashboard(false)}
                  onSetMode={setMode}
                  mode={mode}
              />
          )}
          {showTeamDashboard && activeGameId && (
              <TeamDashboard 
                  gameId={activeGameId}
                  totalMapPoints={activeGame?.points.length || 0}
                  onOpenAgents={() => {}}
                  onClose={() => setShowTeamDashboard(false)}
                  chatHistory={chatHistory}
              />
          )}
          {showDeleteGames && (
              <DeleteGamesModal 
                  games={games}
                  onClose={() => setShowDeleteGames(false)}
                  onDeleteGame={handleDeleteGame}
              />
          )}
          {showPlaygroundManager && (
              <PlaygroundManager 
                  onClose={() => setShowPlaygroundManager(false)}
                  onEdit={(template) => {
                      setPlaygroundTemplateToEdit(template);
                      setShowPlaygroundManager(false);
                  }}
                  onCreate={() => {
                      // Logic to create new template
                  }}
              />
          )}
          {showChatDrawer && activeGameId && (
              <ChatDrawer 
                  isOpen={showChatDrawer}
                  onClose={() => setShowChatDrawer(false)}
                  messages={chatHistory}
                  gameId={activeGameId}
                  mode={mode}
                  userName={authUser?.name || "Player"}
                  isInstructor={mode === GameMode.INSTRUCTOR}
              />
          )}
          {activeTaskActionPoint && activeGame && (
              <TaskActionModal 
                  point={activeTaskActionPoint}
                  allPoints={activeGame.points}
                  playgrounds={activeGame.playgrounds}
                  onClose={() => setActiveTaskActionPoint(null)}
                  onSave={(updatedPoint) => {
                      if (activeGame) {
                          const updatedPoints = activeGame.points.map(p => p.id === updatedPoint.id ? updatedPoint : p);
                          updateActiveGame({ ...activeGame, points: updatedPoints });
                      }
                  }}
                  onStartDrawMode={() => {}}
              />
          )}
          {latestMessage && (
              <MessagePopup 
                  message={latestMessage.message} 
                  sender={latestMessage.sender} 
                  onClose={() => setLatestMessage(null)}
                  isUrgent={latestMessage.isUrgent}
              />
          )}
      </>
  );

  if (showLanding) {
      return (
          <>
            <InitialLanding 
                version="3.1.0"
                games={games}
                activeGameId={activeGameId}
                onSelectGame={setActiveGameId}
                onAction={(action) => {
                    if (action === 'PLAY') {
                        if (activeGameId) {
                            setMode(GameMode.PLAY);
                            setShowLanding(false);
                        } else {
                            setShowGameChooser(true);
                        }
                        return;
                    }
                    if (action === 'PREVIEW_TEAM') {
                        setShowLanding(false);
                        setMode(GameMode.PLAY);
                        return;
                    }
                    ensureSession(() => {
                        switch (action) {
                            case 'GAMES': setShowGameChooser(true); break;
                            case 'CREATE_GAME': setGameToEdit(null); setShowGameCreator(true); break;
                            case 'EDIT_GAME': 
                                if (activeGameId) {
                                    setMode(GameMode.EDIT);
                                    setShowLanding(false);
                                } else {
                                    setShowGameChooser(true);
                                }
                                break;
                            case 'USERS': 
                                setDashboardTab('users'); 
                                setShowDashboard(true); 
                                break;
                            case 'TASKS': setTaskMasterInitialTab('LIBRARY'); setShowTaskMaster(true); break;
                            case 'TASKLIST': setTaskMasterInitialTab('LISTS'); setShowTaskMaster(true); break;
                            case 'TEAM_LOBBY': setShowTeamsHub(true); break;
                            case 'DELETE_GAMES': setShowDeleteGames(true); break;
                            case 'PLAYGROUNDS': setShowPlaygroundManager(true); break;
                            case 'DATABASE': setShowDatabaseTools(true); break;
                            case 'CLIENT_PORTAL':
                                setDashboardTab('client');
                                setShowDashboard(true);
                                break;
                            // ... other actions
                        }
                    });
                }}
            />
            {showDatabaseTools && (
                <AdminModal 
                    games={games}
                    onClose={() => setShowDatabaseTools(false)}
                    onDeleteGame={handleDeleteGame}
                    initialShowSql={true}
                />
            )}
            {renderModals()}
          </>
      );
  }

  // Active Game View (Map & HUD)
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
            <GameMap 
                ref={mapRef}
                userLocation={userLocation}
                points={activeGame?.points || []}
                routes={activeGame?.routes || []}
                dangerZones={activeGame?.dangerZones || []}
                measurePath={measurePath}
                mode={mode}
                mapStyle={localMapStyle || 'osm'} 
                onPointClick={handlePointClick}
                onZoneClick={(z) => setActiveDangerZone(z)}
                onMapClick={handleMapClick}
                onDeletePoint={handleDeleteItem}
                onPointMove={async (id, loc) => {
                    if (!activeGame) return;
                    const updatedPoints = activeGame.points.map(p => p.id === id ? { ...p, location: loc } : p);
                    const updatedPlaygrounds = (activeGame.playgrounds || []).map(pg => pg.id === id ? { ...pg, location: loc } : pg);
                    const updatedZones = (activeGame.dangerZones || []).map(z => z.id === id ? { ...z, location: loc } : z);
                    await updateActiveGame({ ...activeGame, points: updatedPoints, playgrounds: updatedPlaygrounds, dangerZones: updatedZones });
                }}
                accuracy={gpsAccuracy}
                isRelocating={isRelocating}
                showScores={showScores}
            />
        </div>

        <GameHUD 
            accuracy={gpsAccuracy}
            mode={mode}
            toggleMode={() => {}}
            onSetMode={setMode}
            onOpenGameManager={() => setShowGameChooser(true)}
            onOpenTaskMaster={() => setShowTaskMaster(true)}
            onOpenTeams={() => setShowTeamsHub(true)}
            mapStyle={localMapStyle || 'osm'}
            onSetMapStyle={(s) => setLocalMapStyle(s)}
            language={activeGame?.language || 'English'}
            onBackToHub={() => setShowLanding(true)}
            activeGameName={activeGame?.name}
            onOpenInstructorDashboard={() => setShowInstructorDashboard(true)}
            isMeasuring={isMeasuring}
            onToggleMeasure={handleToggleMeasure}
            measuredDistance={measuredDistance}
            measurePointsCount={measurePointsCount}
            playgrounds={activeGame?.playgrounds}
            onOpenPlayground={(id) => setViewingPlaygroundId(id)}
            onOpenTeamDashboard={() => setShowTeamDashboard(true)}
            onRelocateGame={handleRelocateGame}
            isRelocating={isRelocating}
            timerConfig={activeGame?.timerConfig}
            onFitBounds={() => mapRef.current?.fitBounds(activeGame?.points || [])}
            onLocateMe={handleLocateMe}
            onSearchLocation={(c) => mapRef.current?.jumpTo(c)}
            isDrawerExpanded={isEditorExpanded}
            showScores={showScores}
            onToggleScores={() => setShowScores(!showScores)}
            hiddenPlaygroundIds={[]}
            onToggleChat={() => setShowChatDrawer(!showChatDrawer)}
            unreadMessagesCount={0}
            onAddDangerZone={handleAddDangerZone}
            activeDangerZone={mode === GameMode.PLAY ? currentDangerZone : null}
            onEditGameSettings={() => { setGameToEdit(activeGame || null); setShowGameCreator(true); }}
            onOpenGameChooser={() => setShowGameChooser(true)}
            routes={activeGame?.routes}
            onAddRoute={(route) => activeGame && updateActiveGame({ ...activeGame, routes: [...(activeGame.routes || []), route] })}
            onToggleRoute={(id) => {
                if (!activeGame) return;
                const updated = (activeGame.routes || []).map(r => r.id === id ? { ...r, isVisible: !r.isVisible } : r);
                updateActiveGame({ ...activeGame, routes: updated });
            }}
        />

        {(mode === GameMode.EDIT || playgroundTemplateToEdit) && (
            <EditorDrawer 
                onClose={() => setMode(GameMode.PLAY)}
                activeGame={activeGame}
                activeGameName={activeGame?.name || "No Game"}
                points={activeGame?.points || []}
                allPoints={activeGame?.points || []}
                games={games}
                onSelectGame={setActiveGameId}
                onOpenGameChooser={() => setShowGameChooser(true)}
                taskLists={taskLists}
                sourceListId=""
                onSetSourceListId={() => {}}
                onEditPoint={(p) => setActiveTask(p)}
                onSelectPoint={(p) => { setActiveTask(p); mapRef.current?.jumpTo(p.location); }}
                onDeletePoint={handleDeleteItem}
                onReorderPoints={async (pts) => { if (activeGame) await updateActiveGame({ ...activeGame, points: pts }); }}
                onClearMap={() => { if (activeGame && confirm("Clear all points?")) updateActiveGame({ ...activeGame, points: [] }); }}
                onSaveGame={() => updateActiveGame(activeGame!)}
                onOpenTaskMaster={() => setShowTaskMaster(true)}
                onFitBounds={() => mapRef.current?.fitBounds(activeGame?.points || [])}
                onOpenPlaygroundEditor={() => setViewingPlaygroundId(activeGame?.playgrounds?.[0]?.id || null)}
                initialExpanded={true}
                onExpandChange={setIsEditorExpanded}
                routes={activeGame?.routes}
                onAddRoute={(route) => activeGame && updateActiveGame({ ...activeGame, routes: [...(activeGame.routes || []), route] })}
                onDeleteRoute={(id) => activeGame && updateActiveGame({ ...activeGame, routes: (activeGame.routes || []).filter(r => r.id !== id) })}
                onUpdateRoute={handleUpdateRoute}
                onToggleRoute={(id) => { if (activeGame) { const updated = (activeGame.routes || []).map(r => r.id === id ? { ...r, isVisible: !r.isVisible } : r); updateActiveGame({ ...activeGame, routes: updated }); }}}
                showScores={showScores}
                onToggleScores={() => setShowScores(!showScores)}
                isGameTemplateMode={false}
                onAddTask={async (type, playgroundId) => {
                    if (!activeGame) return;
                    const center = mapRef.current?.getCenter() || { lat: 0, lng: 0 };
                    if (type === 'MANUAL') {
                        const newPoint: GamePoint = {
                            id: `p-${Date.now()}`,
                            title: 'New Task',
                            location: playgroundId ? { lat: 0, lng: 0 } : center,
                            playgroundId: playgroundId,
                            iconId: 'default',
                            points: 100,
                            radiusMeters: 30,
                            activationTypes: ['radius'],
                            isUnlocked: true,
                            isCompleted: false,
                            order: activeGame.points.length,
                            task: { type: 'text', question: 'New Task Question' }
                        };
                        await updateActiveGame({ ...activeGame, points: [...activeGame.points, newPoint] });
                        setActiveTask(newPoint);
                    } else if (type === 'LIBRARY' || type === 'AI') {
                        setShowTaskMaster(true);
                    }
                }}
            />
        )}

        {!activeGameId && mode === GameMode.PLAY && !showLanding && !playgroundTemplateToEdit && (
            <WelcomeScreen 
                games={games}
                userLocation={userLocation}
                onStartGame={handleStartGame}
                onSetMapStyle={(s) => setLocalMapStyle(s)}
                language="English"
                onSetLanguage={() => {}}
                onBack={() => setShowLanding(true)}
            />
        )}

        {renderModals()}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LocationProvider>
      <GameApp />
    </LocationProvider>
  );
};

export default App;
