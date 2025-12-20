
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import GameMap from './components/GameMap';
import TaskModal from './components/TaskModal';
import GameHUD from './components/GameHUD';
import GameStats from './components/GameStats';
import GameManager from './components/GameManager';
import TaskEditor from './components/TaskEditor';
import GameChooser from './components/GameChooser';
import TaskPreview from './components/TaskPreview';
import TaskMaster from './components/TaskMaster';
import TaskPlaylistModal from './components/TaskPlaylistModal';
import AiTaskGenerator from './components/AiTaskGenerator';
import WelcomeScreen from './components/WelcomeScreen';
import ResultsView from './components/ResultsView';
import LandingPage from './components/LandingPage';
import TeamsModal from './components/TeamsModal';
import CreatorDrawer from './components/CreatorDrawer';
import EditorDrawer from './components/EditorDrawer';
import AdminModal from './components/AdminModal'; 
import { GamePoint, Coordinate, GameState, GameMode, Game, TaskTemplate, TaskList, MapStyleId, Language } from './types';
import { haversineMeters, isWithinRadius } from './utils/geo';
import { Loader2 } from 'lucide-react';
import * as db from './services/db';
import { teamSync } from './services/teamSync';
import { seedTeams } from './utils/demoContent';

const App: React.FC = () => {
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

  const [mode, setMode] = useState<GameMode>(GameMode.PLAY);
  const [mapStyle, setMapStyle] = useState<MapStyleId>('osm'); 
  const [appLanguage, setAppLanguage] = useState<Language>('English');
  
  // Selection States
  const [selectedPoint, setSelectedPoint] = useState<GamePoint | null>(null);
  const [editingPoint, setEditingPoint] = useState<GamePoint | null>(null);
  
  // Modal/Drawer States
  const [activeDrawer, setActiveDrawer] = useState<'CREATOR' | 'EDITOR' | 'NONE'>('NONE');
  const [showGameChooser, setShowGameChooser] = useState(false);
  const [showTaskMaster, setShowTaskMaster] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showGameManager, setShowGameManager] = useState(false); 
  const [showAdminModal, setShowAdminModal] = useState(false); 

  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  
  // New: Source List for Quick Placing
  const [placingSourceListId, setPlacingSourceListId] = useState<string>('');

  // Selection Mode State (Add from Library to Game)
  const [isTaskMasterSelectionMode, setIsTaskMasterSelectionMode] = useState(false);

  // Nav State
  const [showLanding, setShowLanding] = useState(true);
  const [bypassWelcome, setBypassWelcome] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data Fetching Function
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
        const [games, library, lists] = await Promise.all([
            db.fetchGames(),
            db.fetchLibrary(),
            db.fetchTaskLists()
        ]);
        
        const totalScore = games.reduce((acc, game) => {
            const gameScore = game.points
                .filter(p => p.isCompleted)
                .reduce((sum, p) => sum + (p.points || 100), 0);
            return acc + gameScore;
        }, 0);

        // PERSISTENCE CHECK: Restore last active game if valid
        const lastGameId = localStorage.getItem('geohunt_last_game_id');
        let restoredActiveId = null;
        if (lastGameId && games.find(g => g.id === lastGameId)) {
            restoredActiveId = lastGameId;
        }

        setGameState(prev => ({ 
            ...prev, 
            activeGameId: prev.activeGameId || restoredActiveId, // Use existing if set, else restore
            games: games,
            taskLibrary: library,
            taskLists: lists,
            score: totalScore
        }));
        
        // If we restored a game, hide landing
        if (restoredActiveId && !gameState.activeGameId) {
            setShowLanding(false);
        }

    } catch (e) {
        console.error("Failed to load data", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // PERSISTENCE SAVE: Save game ID whenever it changes
  useEffect(() => {
      if (gameState.activeGameId) {
          localStorage.setItem('geohunt_last_game_id', gameState.activeGameId);
      }
  }, [gameState.activeGameId]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const userLoc: Coordinate = { lat: latitude, lng: longitude };

        setGameState(prev => {
          let currentGames = prev.games;
          const activeGameIndex = currentGames.findIndex(g => g.id === prev.activeGameId);
          let newGames = [...currentGames];
          let updated = false;

          if (activeGameIndex !== -1 && mode === GameMode.PLAY) {
             const activeGame = newGames[activeGameIndex];
             const updatedPoints = activeGame.points.map(p => {
                if (p.isUnlocked) return p;
                if (isWithinRadius(userLoc, p.location, p.radiusMeters)) {
                   updated = true;
                   return { ...p, isUnlocked: true };
                }
                return p;
             });
             
             if (updated) {
                 newGames[activeGameIndex] = { ...activeGame, points: updatedPoints };
                 db.saveGame(newGames[activeGameIndex]);
             }
          }

          return {
            ...prev,
            games: newGames,
            userLocation: userLoc,
            gpsAccuracy: accuracy,
          };
        });
        
        if(loading && gameState.games.length > 0) setLoading(false);
      },
      (err) => {
        console.error(err);
        if (gameState.userLocation) return;
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [mode, loading, gameState.games.length]); 

  // Derived State
  const activeGame = gameState.games.find(g => g.id === gameState.activeGameId);
  const activePoints = activeGame ? activeGame.points : [];

  const selectedDistance = useMemo(() => {
    if (!gameState.userLocation || !selectedPoint) return 0;
    return haversineMeters(gameState.userLocation, selectedPoint.location);
  }, [gameState.userLocation, selectedPoint]);

  const nearestPointDistance = useMemo(() => {
    if (!gameState.userLocation || activePoints.length === 0) return null;
    const incomplete = activePoints.filter(p => !p.isCompleted);
    if (incomplete.length === 0) return null;
    return Math.min(...incomplete.map(p => haversineMeters(gameState.userLocation!, p.location)));
  }, [gameState.userLocation, activePoints]);

  const activeGameScore = useMemo(() => {
      if(!activeGame) return 0;
      return activeGame.points.filter(p => p.isCompleted).reduce((sum, p) => sum + (p.points || 100), 0);
  }, [activeGame]);

  const pointsCount = useMemo(() => ({
      total: activePoints.filter(p => !p.isSectionHeader).length,
      completed: activePoints.filter(p => p.isCompleted).length
  }), [activePoints]);

  // --- ACTIONS ---

  const handleBackToHub = useCallback(() => {
      setGameState(prev => ({ ...prev, activeGameId: null }));
      localStorage.removeItem('geohunt_last_game_id'); // Clear persistence on explicit exit
      setShowLanding(true);
      setActiveDrawer('NONE');
      setShowGameChooser(false);
      setShowTaskMaster(false);
      setShowTeamsModal(false);
      setShowPlaylistModal(false);
      setShowAiGenerator(false);
      setShowAdminModal(false);
      setMode(GameMode.PLAY);
      setBypassWelcome(false); 
  }, []);

  const handleHomeFromHub = useCallback(() => {
      // Go back to "Player View" (Welcome Screen)
      setShowLanding(false);
      setBypassWelcome(false);
      setGameState(prev => ({ ...prev, activeGameId: null }));
      localStorage.removeItem('geohunt_last_game_id');
  }, []);

  // Landing Page Action Handler
  const handleLandingAction = (action: 'CREATE' | 'EDIT' | 'TEAM' | 'TASKS' | 'ADMIN') => {
      setShowLanding(false);
      setBypassWelcome(true);
      
      switch(action) {
          case 'CREATE':
              setActiveDrawer('CREATOR');
              setMode(GameMode.EDIT);
              break;
          case 'EDIT':
              // If we already have an active game from persistence, go straight to Editor
              if (gameState.activeGameId) {
                  setActiveDrawer('EDITOR');
              } else {
                  setShowGameChooser(true);
              }
              setMode(GameMode.EDIT);
              break;
          case 'TEAM':
              // Inject demo data if empty
              if (gameState.games.length > 0 && gameState.activeGameId) {
                  seedTeams(gameState.activeGameId);
              }
              setShowTeamsModal(true);
              setMode(GameMode.PLAY);
              break;
          case 'TASKS':
              setShowTaskMaster(true);
              setMode(GameMode.EDIT);
              break;
          case 'ADMIN':
              setShowAdminModal(true);
              setMode(GameMode.EDIT);
              break;
      }
  };

  const handleStartGame = (gameId: string, teamName: string, userName: string, _ignoredMapStyle: MapStyleId) => {
      const game = gameState.games.find(g => g.id === gameId);
      const styleToUse = game?.defaultMapStyle || 'osm';
      
      setGameState(prev => ({ ...prev, activeGameId: gameId, teamName, userName }));
      setMapStyle(styleToUse);
      setMode(GameMode.PLAY);
      teamSync.connect(gameId, teamName, userName);
  };

  const handleCreateGame = (name: string, fromTaskListId?: string, description?: string, mapStyle: MapStyleId = 'osm') => {
    let initialPoints: GamePoint[] = [];

    if (fromTaskListId) {
        const list = gameState.taskLists.find(l => l.id === fromTaskListId);
        if (list && list.tasks.length > 0) {
             const center = gameState.userLocation || { lat: 55.6761, lng: 12.5683 };
             initialPoints = list.tasks.map((tpl, i) => {
                 const r = 500 * Math.sqrt(Math.random()); 
                 const theta = Math.random() * 2 * Math.PI;
                 const dLat = (r * Math.cos(theta)) / 111320;
                 const dLng = (r * Math.sin(theta)) / (111320 * Math.cos(center.lat * Math.PI / 180));

                 return {
                     id: `${Date.now()}-pt-${i}`,
                     title: tpl.title,
                     task: tpl.task,
                     location: { lat: center.lat + dLat, lng: center.lng + dLng },
                     radiusMeters: 30,
                     iconId: tpl.iconId,
                     isUnlocked: false,
                     isCompleted: false,
                     order: i,
                     tags: tpl.tags,
                     activationTypes: ['radius'],
                     points: tpl.points || 100,
                 };
             });
        }
    }

    const newGame: Game = {
      id: `game-${Date.now()}`,
      name,
      description: description || '',
      points: initialPoints,
      createdAt: Date.now(),
      defaultMapStyle: mapStyle
    };
    
    db.saveGame(newGame);

    setGameState(prev => ({
      ...prev,
      games: [...prev.games, newGame],
      activeGameId: newGame.id
    }));
    setMapStyle(mapStyle);
    
    if (fromTaskListId) {
        setPlacingSourceListId(fromTaskListId);
    } else {
        setPlacingSourceListId('');
    }
    
    setMode(GameMode.EDIT);
    setActiveDrawer('EDITOR'); // Switch to editor immediately
    setShowGameChooser(false); 
    setActiveDrawer('EDITOR');
  };
  
  const handleSelectGame = (id: string) => {
    const game = gameState.games.find(g => g.id === id);
    if(game && game.defaultMapStyle) setMapStyle(game.defaultMapStyle);
    
    setGameState(prev => ({ ...prev, activeGameId: id }));
    setShowGameChooser(false);
    
    // If we were in the "Edit" flow (implied by showGameChooser being open while in Edit mode), open Editor Drawer
    if (mode === GameMode.EDIT) {
        setActiveDrawer('EDITOR');
    }
    setPlacingSourceListId('');
  };

  const handleDeleteGame = async (id: string) => {
      await db.deleteGame(id);
      refreshData();
      if (gameState.activeGameId === id) {
          setGameState(prev => ({ ...prev, activeGameId: null }));
          localStorage.removeItem('geohunt_last_game_id');
          setShowLanding(true);
      }
  };

  const handleReorderPoints = (reorderedPoints: GamePoint[]) => {
    if (!gameState.activeGameId) return;
    const updatedPoints = reorderedPoints.map((p, index) => ({ ...p, order: index }));
    const gameIdx = gameState.games.findIndex(g => g.id === gameState.activeGameId);
    if(gameIdx === -1) return;
    const updatedGame = { ...gameState.games[gameIdx], points: updatedPoints };
    db.saveGame(updatedGame);
    setGameState(prev => {
        const newGames = [...prev.games];
        newGames[gameIdx] = updatedGame;
        return { ...prev, games: newGames };
    });
  };

  const handleClearMap = () => {
      if(!gameState.activeGameId) return;
      if(window.confirm("Are you sure you want to remove ALL points from the map? This cannot be undone.")) {
          setGameState(prev => {
              const gameIdx = prev.games.findIndex(g => g.id === prev.activeGameId);
              if (gameIdx === -1) return prev;
              
              const updatedGame = { ...prev.games[gameIdx], points: [] };
              db.saveGame(updatedGame); // Fire and forget
              
              const newGames = [...prev.games];
              newGames[gameIdx] = updatedGame;
              return { ...prev, games: newGames };
          });
          // Also clear selection
          setSelectedPoint(null);
          setEditingPoint(null);
      }
  };

  const handleMapClick = (coord: Coordinate) => {
    if (mode === GameMode.EDIT && gameState.activeGameId) {
      let nextTemplate: TaskTemplate | undefined;
      let newPointId = `pt-${Date.now()}`;
      
      if (placingSourceListId) {
          const list = gameState.taskLists.find(l => l.id === placingSourceListId);
          if (list) {
              const existingTitles = activePoints.map(p => p.title);
              nextTemplate = list.tasks.find(t => !existingTitles.includes(t.title));
              if (!nextTemplate) {
                  alert(`All tasks from "${list.name}" have already been placed on the map.`);
                  return;
              }
          } else {
              setPlacingSourceListId('');
          }
      }

      let newPoint: GamePoint;
      if (nextTemplate) {
           newPoint = {
            id: newPointId,
            title: nextTemplate.title,
            task: nextTemplate.task,
            location: coord,
            radiusMeters: 30,
            iconId: nextTemplate.iconId,
            isUnlocked: false,
            isCompleted: false,
            order: activePoints.length,
            tags: nextTemplate.tags,
            points: nextTemplate.points || 100,
            feedback: nextTemplate.feedback,
            settings: nextTemplate.settings,
            activationTypes: ['radius']
          };
      } else {
          newPoint = {
            id: newPointId,
            title: "New Task",
            