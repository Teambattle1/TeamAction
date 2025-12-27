
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Game, GameMode, GameState, TaskList, GamePoint, Team, Coordinate, TaskTemplate, MapStyleId, AuthUser, GameRoute, DangerZone } from './types';
import GameMap, { GameMapHandle } from './components/GameMap';
import GameHUD from './components/GameHUD';
import WelcomeScreen from './components/WelcomeScreen';
import GameManager from './components/GameManager';
import TaskMaster from './components/TaskMaster';
import TeamsModal from './components/TeamsModal';
import InstructorDashboard from './components/InstructorDashboard';
import TeamDashboard from './components/TeamDashboard';
import ChatDrawer from './components/ChatDrawer';
import TaskModal from './components/TaskModal';
import MessagePopup from './components/MessagePopup';
import ResultsView from './components/ResultsView';
import InitialLanding from './components/InitialLanding';
import GameCreator from './components/GameCreator';
import PlaygroundModal from './components/PlaygroundModal';
import PlaygroundEditor from './components/PlaygroundEditor';
import LoginPage from './components/LoginPage';
import CreatorHub from './components/CreatorHub';
import TeamsHubModal from './components/TeamsHubModal';
import DeleteGamesModal from './components/DeleteGamesModal';
import PlaygroundManager from './components/PlaygroundManager';
import PlaygroundLibraryModal from './components/PlaygroundLibraryModal';
import TeamChatOverview from './components/TeamChatOverview';
import InstructorMobileDashboard from './components/InstructorMobileDashboard';
import ClientSubmissionView from './components/ClientSubmissionView';
import EditorDrawer from './components/EditorDrawer';
import GameChooser from './components/GameChooser';
import DangerZoneModal from './components/DangerZoneModal';

import * as db from './services/db';
import { teamSync } from './services/teamSync';
import { authService } from './services/auth';
import { isWithinRadius, haversineMeters } from './utils/geo';

const App: React.FC = () => {
  // --- STATE ---
  const [mode, setMode] = useState<GameMode>(GameMode.PLAY);
  const [games, setGames] = useState<Game[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [library, setLibrary] = useState<TaskTemplate[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  // User/Auth
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [team, setTeam] = useState<Team | null>(null); 
  
  // Game State
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  
  // Editor Tools State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePath, setMeasurePath] = useState<Coordinate[]>([]);
  const [activeDangerZone, setActiveDangerZone] = useState<DangerZone | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);
  
  // Map View State
  const [localMapStyle, setLocalMapStyle] = useState<MapStyleId | null>(null);
  const [showScores, setShowScores] = useState(false);
  
  // UI Flags
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreatorHub, setShowCreatorHub] = useState(false);
  const [showGameChooser, setShowGameChooser] = useState(false);
  const [showTaskMaster, setShowTaskMaster] = useState(false);
  const [showTeamsHub, setShowTeamsHub] = useState(false);
  const [showInstructorDashboard, setShowInstructorDashboard] = useState(false);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showGameCreator, setShowGameCreator] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [viewingPlaygroundId, setViewingPlaygroundId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<GamePoint | null>(null);
  const [showDeleteGames, setShowDeleteGames] = useState(false);
  
  // Editor Specific
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [isEditorExpanded, setIsEditorExpanded] = useState(true);
  
  // Danger Zone Tracking
  const lastPenaltyTimeRef = useRef<number>(0);
  const activeZoneIdRef = useRef<string | null>(null);
  
  const mapRef = useRef<GameMapHandle>(null);

  // Derived State
  const activeGame = useMemo(() => games.find(g => g.id === activeGameId) || null, [games, activeGameId]);
  
  // Initialize local map style when game loads, OR when it updates
  useEffect(() => {
      if (activeGame?.defaultMapStyle) {
          setLocalMapStyle(activeGame.defaultMapStyle);
      } else if (!localMapStyle) {
          setLocalMapStyle('osm');
      }
  }, [activeGame?.id, activeGame?.defaultMapStyle]);

  const measuredDistance = useMemo(() => {
      if (measurePath.length < 2) return 0;
      let dist = 0;
      for (let i = 0; i < measurePath.length - 1; i++) {
          dist += haversineMeters(measurePath[i], measurePath[i+1]);
      }
      return dist;
  }, [measurePath]);

  const measurePointsCount = useMemo(() => {
      if (!activeGame || measurePath.length === 0) return 0;
      let count = 0;
      const pathSet = new Set(measurePath.map(c => `${c.lat},${c.lng}`));
      
      activeGame.points.forEach(p => {
          if (pathSet.has(`${p.location.lat},${p.location.lng}`)) {
              count++;
          }
      });
      return count;
  }, [measurePath, activeGame]);

  const gameState: GameState = {
      activeGameId,
      games,
      taskLibrary: library,
      taskLists,
      score: team?.score || 0,
      userLocation,
      gpsAccuracy,
      teamName: team?.name,
      teamId: team?.id,
      userName: authUser?.name || 'Guest',
      deviceId: teamSync.getDeviceId()
  };

  // --- EFFECTS ---

  useEffect(() => {
      const loadData = async () => {
          const [g, l, lib] = await Promise.all([
              db.fetchGames(),
              db.fetchTaskLists(),
              db.fetchLibrary()
          ]);
          setGames(g);
          setTaskLists(l);
          setLibrary(lib);
          
          const user = authService.getCurrentUser();
          if (user) setAuthUser(user);
      };
      loadData();
  }, []);

  useEffect(() => {
      if (games.length > 0 && !activeGameId) {
          const savedId = localStorage.getItem('geohunt_game_id');
          if (savedId) {
              const gameExists = games.find(g => g.id === savedId);
              if (gameExists) {
                  setActiveGameId(savedId);
                  setShowLanding(false);
                  setMode(GameMode.EDIT); 
              } else {
                  localStorage.removeItem('geohunt_game_id');
              }
          }
      }
  }, [games]);

  useEffect(() => {
      if (activeGameId) {
          localStorage.setItem('geohunt_game_id', activeGameId);
      }
  }, [activeGameId]);

  useEffect(() => {
      const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 1024;
      if (isDesktop) return;

      const watchId = navigator.geolocation.watchPosition(
          (pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(loc);
              setGpsAccuracy(pos.coords.accuracy);
              teamSync.updateLocation(loc);
          },
          (err) => {},
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
      if (mode !== GameMode.PLAY || !activeGame || !team || !userLocation) return;

      const currentZone = activeGame.dangerZones?.find(z => isWithinRadius(userLocation, z.location, z.radius));

      if (currentZone) {
          activeZoneIdRef.current = currentZone.id;
          if (currentZone.penaltyType === 'time_based') {
              const now = Date.now();
              if (now - lastPenaltyTimeRef.current >= 1000) {
                  db.updateTeamScore(team.id, -currentZone.penalty);
                  setTeam(prev => prev ? { ...prev, score: Math.max(0, prev.score - currentZone.penalty) } : null);
                  lastPenaltyTimeRef.current = now;
              }
          }
      } else {
          activeZoneIdRef.current = null;
      }

      const interval = setInterval(() => {
          if (activeZoneIdRef.current) {
              const zone = activeGame.dangerZones?.find(z => z.id === activeZoneIdRef.current);
              if (zone && zone.penaltyType === 'time_based') {
                  const now = Date.now();
                  if (now - lastPenaltyTimeRef.current >= 1000) {
                      db.updateTeamScore(team.id, -zone.penalty);
                      setTeam(prev => prev ? { ...prev, score: Math.max(0, prev.score - zone.penalty) } : null);
                      lastPenaltyTimeRef.current = now;
                  }
              }
          }
      }, 1000);

      return () => clearInterval(interval);
  }, [userLocation, mode, activeGame, team?.id]); 

  // --- ACTIONS ---

  const updateActiveGame = async (updatedGame: Game) => {
      await db.saveGame(updatedGame);
      setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
  };

  const handleSaveGameData = async (gameData: Partial<Game>) => {
      const targetId = gameData.id || gameToEdit?.id;

      if (targetId) {
          const existingGame = games.find(g => g.id === targetId);
          if (existingGame) {
              const updatedGame = { ...existingGame, ...gameData };
              await updateActiveGame(updatedGame);
          }
          setGameToEdit(null);
      } else {
          const newGame: Game = {
              id: `game-${Date.now()}`,
              name: gameData.name || 'New Game',
              description: gameData.description || '',
              language: gameData.language || 'English',
              points: [],
              createdAt: Date.now(),
              defaultMapStyle: gameData.defaultMapStyle || 'osm',
              client: gameData.client,
              timerConfig: gameData.timerConfig
          };
          await db.saveGame(newGame);
          setGames([...games, newGame]);
          setActiveGameId(newGame.id);
          setMode(GameMode.EDIT);
          setShowLanding(false);
          setShowCreatorHub(false);
      }
      setShowGameCreator(false);
  };

  const handleDeleteGame = async (id: string) => {
      await db.deleteGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
      if (activeGameId === id) {
          setActiveGameId(null);
          localStorage.removeItem('geohunt_game_id');
          setShowLanding(true);
      }
      setShowGameCreator(false);
      setGameToEdit(null);
  };

  const handleStartGame = async (gameId: string, teamName: string, userName: string, teamPhoto: string | null, style: MapStyleId) => {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      setActiveGameId(gameId);
      const newTeam: Team = {
          id: `team-${Date.now()}`,
          gameId,
          name: teamName,
          joinCode: Math.floor(1000 + Math.random() * 9000).toString(),
          photoUrl: teamPhoto || undefined,
          score: 0,
          members: [{ name: userName, deviceId: teamSync.getDeviceId(), photo: localStorage.getItem('geohunt_temp_user_photo') || undefined }],
          updatedAt: new Date().toISOString(),
          isStarted: true,
          completedPointIds: []
      };
      
      await db.registerTeam(newTeam);
      setTeam(newTeam);
      teamSync.connect(gameId, teamName, userName);
      
      setShowLanding(false);
      setMode(GameMode.PLAY);
  };

  const handleToggleMeasure = () => {
      if (isMeasuring) {
          setIsMeasuring(false);
          setMeasurePath([]);
      } else {
          setIsMeasuring(true);
          setIsRelocating(false);
      }
  };

  const handleAddDangerZone = async () => {
      if (!activeGame) return;
      const center = mapRef.current?.getCenter() || { lat: 0, lng: 0 };
      const newZone: DangerZone = {
          id: `dz-${Date.now()}`,
          location: center,
          radius: 50,
          penalty: 10,
          duration: 10,
          penaltyType: 'fixed',
          title: 'DANGER ZONE'
      };
      const updatedGame = {
          ...activeGame,
          dangerZones: [...(activeGame.dangerZones || []), newZone]
      };
      setGames(prev => prev.map(g => g.id === activeGame.id ? updatedGame : g));
      await db.saveGame(updatedGame);
      setTimeout(() => setActiveDangerZone(newZone), 100);
  };

  const handleUpdateDangerZone = async (zone: DangerZone) => {
      if (!activeGame) return;
      const updatedZones = (activeGame.dangerZones || []).map(z => z.id === zone.id ? zone : z);
      await updateActiveGame({ ...activeGame, dangerZones: updatedZones });
  };

  const handleDeleteItem = async (id: string) => {
      if (!activeGame) return;
      
      let newPoints = activeGame.points.filter(p => p.id !== id);
      let newZones = activeGame.dangerZones || [];
      
      if (newPoints.length === activeGame.points.length) {
          newZones = newZones.filter(z => z.id !== id);
      }

      if (activeDangerZone && activeDangerZone.id === id) {
          setActiveDangerZone(null);
      }

      await updateActiveGame({ ...activeGame, points: newPoints, dangerZones: newZones });
  };

  const handleUpdateRoute = async (routeId: string, updates: Partial<GameRoute>) => {
      if (!activeGame) return;
      const updatedRoutes = (activeGame.routes || []).map(r => 
          r.id === routeId ? { ...r, ...updates } : r
      );
      await updateActiveGame({ ...activeGame, routes: updatedRoutes });
  };

  const handleRelocateGame = async () => {
      if (!activeGame) return;
      if (!isRelocating) {
          setIsRelocating(true);
          setIsMeasuring(false);
      } else {
          const center = mapRef.current?.getCenter();
          if (!center) return;

          const mapPoints = activeGame.points.filter(p => !p.playgroundId);
          if (mapPoints.length === 0) {
              setIsRelocating(false);
              return;
          }

          let sumLat = 0, sumLng = 0;
          mapPoints.forEach(p => { sumLat += p.location.lat; sumLng += p.location.lng; });
          const centroid = { lat: sumLat / mapPoints.length, lng: sumLng / mapPoints.length };

          const dLat = center.lat - centroid.lat;
          const dLng = center.lng - centroid.lng;

          const newPoints = activeGame.points.map(p => {
              if (p.playgroundId) return p;
              return { ...p, location: { lat: p.location.lat + dLat, lng: p.location.lng + dLng } };
          });

          const newPlaygrounds = (activeGame.playgrounds || []).map(pg => {
              if (!pg.location) return pg;
              return { ...pg, location: { lat: pg.location.lat + dLat, lng: pg.location.lng + dLng } };
          });
          
          const newZones = (activeGame.dangerZones || []).map(z => ({
              ...z,
              location: { lat: z.location.lat + dLat, lng: z.location.lng + dLng }
          }));

          await updateActiveGame({ ...activeGame, points: newPoints, playgrounds: newPlaygrounds, dangerZones: newZones });
          setIsRelocating(false);
      }
  };

  const handleLocateMe = () => {
      navigator.geolocation.getCurrentPosition(
          (pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(loc);
              setGpsAccuracy(pos.coords.accuracy);
              teamSync.updateLocation(loc);
              mapRef.current?.jumpTo(loc);
          },
          (err) => {
              alert("Could not locate device: " + err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
  };

  const handleMapClick = useCallback((coord: Coordinate) => {
      if (isMeasuring) {
          setMeasurePath(prev => [...prev, coord]);
      }
  }, [isMeasuring]);

  const handlePointClick = (p: GamePoint) => {
      if (isMeasuring) {
          setMeasurePath(prev => [...prev, p.location]);
      } else {
          setActiveTask(p);
      }
  };

  // --- RENDER ---

  const urlParams = new URLSearchParams(window.location.search);
  const submitToToken = urlParams.get('submitTo');
  if (submitToToken) {
      return <ClientSubmissionView token={submitToToken} />;
  }

  if (showLanding && !authUser) {
      if (showLogin) {
          return <LoginPage onLoginSuccess={(u) => { setAuthUser(u); setShowLogin(false); }} onPlayAsGuest={() => setShowLogin(false)} />;
      }
      return (
          <InitialLanding 
              version="3.0.0"
              games={games}
              activeGameId={activeGameId}
              onSelectGame={setActiveGameId}
              onAction={(action) => {
                  if (action === 'ADMIN' || action === 'USERS' || action === 'DATABASE') setShowLogin(true);
                  else if (action === 'GAMES') setShowGameChooser(true);
                  else if (action === 'EDIT_GAME') { if(activeGameId) { setShowLanding(false); setMode(GameMode.EDIT); } else setShowGameChooser(true); }
                  else if (action === 'PLAY' || action === 'TEAMS') setShowLanding(false);
                  else if (action === 'TASKS' || action === 'TASKLIST' || action === 'TAGS' || action === 'CLIENT_PORTAL' || action === 'QR_CODES') setShowTaskMaster(true);
                  else if (action === 'DASHBOARD') setShowLogin(true);
                  else if (action === 'CHAT') setShowChatDrawer(true);
                  else if (action === 'TEAM_LOBBY') setShowTeamsHub(true);
                  else if (action === 'TEAMS_MAP_VIEW') setShowInstructorDashboard(true);
                  else if (action === 'DELETE_GAMES') setShowDeleteGames(true);
              }}
          />
      );
  }

  if (showLanding && authUser) {
      return (
          <CreatorHub 
              version="3.0.0"
              activeGameName={activeGame?.name}
              onAction={(action) => {
                  if (action === 'PLAY') { setShowLanding(false); setMode(GameMode.PLAY); }
                  else if (action === 'EDIT') { setShowLanding(false); setMode(GameMode.EDIT); }
                  else if (action === 'CREATE') setShowGameCreator(true);
                  else if (action === 'TASKS') setShowTaskMaster(true);
                  else if (action === 'TEAM') setShowTeamsHub(true);
              }}
              onChooseGame={() => setShowGameChooser(true)}
              onBack={() => setAuthUser(null)}
          />
      );
  }

  const currentDangerZone = mode === GameMode.PLAY && activeGame && userLocation 
      ? activeGame.dangerZones?.find(z => isWithinRadius(userLocation, z.location, z.radius)) 
      : null;

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
            accuracy={gameState.gpsAccuracy}
            mode={mode}
            toggleMode={() => {}}
            onSetMode={setMode}
            onOpenGameManager={() => setShowGameChooser(true)}
            onOpenTaskMaster={() => setShowTaskMaster(true)}
            onOpenTeams={() => setShowTeamsHub(true)}
            
            mapStyle={localMapStyle || 'osm'}
            onSetMapStyle={(s) => {
                setLocalMapStyle(s); 
                if(activeGame) updateActiveGame({...activeGame, defaultMapStyle: s});
            }}
            
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

        {mode === GameMode.EDIT && (
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
                onSaveGame={() => { }}
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

        {!activeGameId && mode === GameMode.PLAY && !showLanding && (
            <WelcomeScreen 
                games={games}
                userLocation={userLocation}
                onStartGame={handleStartGame}
                onSetMapStyle={(s) => {}}
                language="English"
                onSetLanguage={() => {}}
                onBack={() => setShowLanding(true)}
            />
        )}

        {showGameChooser && (
            <GameChooser 
                games={games}
                taskLists={taskLists}
                onSelectGame={(id) => { setActiveGameId(id); localStorage.setItem('geohunt_game_id', id); setShowGameChooser(false); setMode(GameMode.EDIT); setShowLanding(false); }}
                onCreateGame={(name, fromId) => handleSaveGameData({ name })}
                onClose={() => setShowGameChooser(false)}
                onOpenGameCreator={() => setShowGameCreator(true)}
                onRefresh={() => db.fetchGames().then(setGames)}
                onEditGame={(game) => { setGameToEdit(game); setShowGameCreator(true); }}
            />
        )}

        {showTaskMaster && (
            <TaskMaster 
                library={library}
                lists={taskLists}
                onClose={() => setShowTaskMaster(false)}
                onSaveTemplate={async (t) => { await db.saveTemplate(t); setLibrary(await db.fetchLibrary()); }}
                onDeleteTemplate={async (id) => { await db.deleteTemplate(id); setLibrary(await db.fetchLibrary()); }}
                onSaveList={async (l) => { await db.saveTaskList(l); setTaskLists(await db.fetchTaskLists()); }}
                onDeleteList={async (id) => { await db.deleteTaskList(id); setTaskLists(await db.fetchTaskLists()); }}
                onCreateGameFromList={(listId) => {}}
                games={games}
                activeGameId={activeGameId}
                onAddTasksToGame={async (gameId, tasks, playgroundId) => {
                    const game = games.find(g => g.id === gameId);
                    if (!game) return;
                    const newPoints = tasks.map((t, i) => {
                        const templateWithExtras = t as TaskTemplate & { radiusMeters?: number, areaColor?: string };
                        return {
                            ...t,
                            id: `p-${Date.now()}-${i}`,
                            location: playgroundId ? { lat: 0, lng: 0 } : (mapRef.current?.getCenter() || { lat: 0, lng: 0 }),
                            playgroundId: playgroundId === 'CREATE_NEW' ? `pg-${Date.now()}` : (playgroundId || undefined),
                            radiusMeters: templateWithExtras.radiusMeters || 30, 
                            areaColor: templateWithExtras.areaColor || undefined, 
                            activationTypes: ['radius'],
                            isUnlocked: true,
                            isCompleted: false,
                            order: game.points.length + i,
                            points: t.points || 100
                        } as GamePoint;
                    });
                    let updatedGame = { ...game, points: [...game.points, ...newPoints] };
                    if (playgroundId === 'CREATE_NEW') {
                        const newPgId = newPoints[0].playgroundId!;
                        updatedGame.playgrounds = [...(game.playgrounds || []), { id: newPgId, title: 'New Zone', buttonVisible: true, iconId: 'default', location: mapRef.current?.getCenter() || { lat: 0, lng: 0 } }];
                    }
                    await updateActiveGame(updatedGame);
                }}
            />
        )}

        {activeTask && (
            <TaskModal 
                point={activeTask}
                onClose={() => setActiveTask(null)}
                onComplete={async (id, score) => {
                    if (!activeGame) return;
                    const updatedPoints = activeGame.points.map(p => p.id === id ? { ...p, isCompleted: true } : p);
                    await updateActiveGame({ ...activeGame, points: updatedPoints });
                    setActiveTask(null);
                }}
                distance={0}
                mode={mode}
            />
        )}

        {activeDangerZone && (
            <DangerZoneModal 
                zone={activeDangerZone}
                onSave={handleUpdateDangerZone}
                onDelete={() => handleDeleteItem(activeDangerZone.id)}
                onClose={() => setActiveDangerZone(null)}
            />
        )}

        {viewingPlaygroundId && activeGame && (
            <PlaygroundEditor 
                game={activeGame}
                onUpdateGame={updateActiveGame}
                onClose={() => setViewingPlaygroundId(null)}
                onEditPoint={(p) => setActiveTask(p)}
                onPointClick={handlePointClick}
                onAddTask={(type) => {
                    if (type === 'MANUAL') {
                        const newPoint: GamePoint = {
                            id: `p-${Date.now()}`,
                            title: 'New Task',
                            location: { lat: 0, lng: 0 },
                            playgroundId: viewingPlaygroundId,
                            playgroundPosition: { x: 50, y: 50 },
                            iconId: 'default',
                            points: 100,
                            radiusMeters: 30,
                            activationTypes: ['radius'],
                            isUnlocked: true,
                            isCompleted: false,
                            order: activeGame.points.length,
                            task: { type: 'text', question: 'New Question' }
                        };
                        updateActiveGame({ ...activeGame, points: [...activeGame.points, newPoint] });
                        setActiveTask(newPoint);
                    } else {
                        setShowTaskMaster(true);
                    }
                }}
                onOpenLibrary={() => setShowTaskMaster(true)}
                showScores={false}
                onToggleScores={() => {}}
                onHome={() => setViewingPlaygroundId(null)}
                isTemplateMode={false}
                onAddZoneFromLibrary={() => {}}
            />
        )}

        {showInstructorDashboard && activeGame && (
            <InstructorDashboard game={activeGame} onClose={() => setShowInstructorDashboard(false)} onSetMode={setMode} />
        )}

        {showTeamDashboard && activeGameId && (
            <TeamDashboard gameId={activeGameId} totalMapPoints={activeGame?.points.length || 0} onOpenAgents={() => {}} onClose={() => setShowTeamDashboard(false)} />
        )}

        {showChatDrawer && activeGameId && (
            <ChatDrawer isOpen={showChatDrawer} onClose={() => setShowChatDrawer(false)} messages={chatMessages} gameId={activeGameId} mode={mode} userName={authUser?.name || 'Guest'} selectedTeamIds={null} />
        )}

        {showGameCreator && (
            <GameCreator 
                onClose={() => { setShowGameCreator(false); setGameToEdit(null); }}
                onCreate={handleSaveGameData}
                baseGame={gameToEdit || undefined}
                onDelete={handleDeleteGame} 
            />
        )}

        {showTeamsHub && (
            <TeamsHubModal 
                onClose={() => setShowTeamsHub(false)}
                onAction={(action) => {
                    if (action === 'JOIN') { setShowTeamsHub(false); setShowLanding(false); setMode(GameMode.PLAY); }
                    else if (action === 'COMMAND') { setShowTeamsHub(false); }
                }}
            />
        )}

        {showDeleteGames && (
            <DeleteGamesModal 
                games={games}
                onClose={() => setShowDeleteGames(false)}
                onDeleteGame={handleDeleteGame}
            />
        )}

    </div>
  );
};

export default App;
