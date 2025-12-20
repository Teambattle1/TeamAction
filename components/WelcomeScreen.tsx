
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Game, Coordinate, MapStyleId, Language, TeamMember, Team, TeamMemberData } from '../types';
import { haversineMeters } from '../utils/geo';
import { t } from '../utils/i18n';
// Added Home and ChevronDown to imports
import { Camera, MapPin, CheckCircle, Users, Loader2, Languages, User, ArrowLeft, RotateCcw, X, Play, Hash, Info, Shield, Trophy, Home, ChevronDown } from 'lucide-react';
import { teamSync } from '../services/teamSync';
import * as db from '../services/db';

interface WelcomeScreenProps {
  games: Game[];
  userLocation: Coordinate | null;
  onStartGame: (gameId: string, teamName: string, userName: string, mapStyle: MapStyleId) => void;
  onSetMapStyle: (style: MapStyleId) => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
  onBack?: () => void;
}

type ViewStep = 'CHOICE' | 'JOIN_OPTIONS' | 'JOIN_CODE' | 'MEMBER_DETAILS' | 'TEAM_LOBBY' | 'TAKE_PHOTO';

const STORAGE_KEY_GAME_ID = 'teambattle_last_game_id';
const STORAGE_KEY_PLAYER_NAME = 'teambattle_player_name';

const getJoinCode = (name: string): string => {
    if (!name) return '000000';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const code = Math.abs(hash) % 900000 + 100000;
    return code.toString();
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    games, 
    userLocation, 
    onStartGame, 
    language,
    onSetLanguage,
    onBack
}) => {
  const [viewStep, setViewStep] = useState<ViewStep>('CHOICE');
  const [selectedGameId, setSelectedGameId] = useState<string>(localStorage.getItem(STORAGE_KEY_GAME_ID) || '');
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem(STORAGE_KEY_PLAYER_NAME) || '');
  const [playerPhoto, setPlayerPhoto] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
  const [isJoiningExisting, setIsJoiningExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [geoPermission, setGeoPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const availableGames = useMemo(() => {
      return games.map(g => {
          let distance: number | null = null;
          if (userLocation && g.points.length > 0) {
              const center = {
                  lat: g.points.reduce((sum, p) => sum + p.location.lat, 0) / g.points.length,
                  lng: g.points.reduce((sum, p) => sum + p.location.lng, 0) / g.points.length,
              };
              distance = haversineMeters(userLocation, center);
          }
          return { ...g, distance };
      }).sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
  }, [games, userLocation]);

  useEffect(() => {
    if (availableGames.length > 0 && !selectedGameId) {
        setSelectedGameId(availableGames[0].id);
    }
  }, [availableGames, selectedGameId]);

  useEffect(() => {
    if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
            setGeoPermission(result.state);
            result.onchange = () => setGeoPermission(result.state);
        });
    }
  }, []);

  // Poll for team updates when in lobby
  useEffect(() => {
      if (viewStep === 'TEAM_LOBBY' && targetTeamId) {
          const poll = async () => {
              const team = await db.fetchTeam(targetTeamId);
              if (team) {
                  setCurrentTeam(team);
                  if (team.isStarted) {
                      onStartGame(team.gameId, team.name, playerName, 'osm');
                  }
              }
          };
          poll();
          const interval = setInterval(poll, 3000);
          return () => clearInterval(interval);
      }
  }, [viewStep, targetTeamId, playerName, onStartGame]);

  const handleCapturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              if (facingMode === 'user') {
                  ctx.translate(canvas.width, 0);
                  ctx.scale(-1, 1);
              }
              ctx.drawImage(video, 0, 0);
              setPlayerPhoto(canvas.toDataURL('image/jpeg', 0.8));
              setViewStep('MEMBER_DETAILS');
          }
      }
  };

  const handleManualCodeSubmit = async () => {
      if (manualCode.length < 6) return;
      setIsLoading(true);
      try {
          let foundTeam: Team | null = null;
          for (const game of games) {
              const teams = await db.fetchTeams(game.id);
              const t = teams.find(team => team.joinCode === manualCode);
              if (t) { foundTeam = t; break; }
          }
          if (foundTeam) {
              setTargetTeamId(foundTeam.id);
              setTeamName(foundTeam.name);
              setIsJoiningExisting(true);
              setViewStep('MEMBER_DETAILS');
          } else {
              alert("Invalid Team Code.");
          }
      } catch (e) { console.error(e); }
      finally { setIsLoading(true); setIsLoading(false); }
  };

  const handleEnterLobby = async () => {
      if (!playerName || (!isJoiningExisting && !teamName)) return;
      setIsLoading(true);
      const deviceId = teamSync.getDeviceId();
      localStorage.setItem(STORAGE_KEY_PLAYER_NAME, playerName);

      try {
          let team: Team;
          if (isJoiningExisting && targetTeamId) {
              const existing = await db.fetchTeam(targetTeamId);
              if (!existing) throw new Error("Team not found");
              
              const newMember: TeamMemberData = { name: playerName, photo: playerPhoto || undefined, deviceId };
              const updatedMembers = [...existing.members.filter(m => m.deviceId !== deviceId), newMember];
              
              team = { ...existing, members: updatedMembers };
          } else {
              const gameId = selectedGameId;
              const cleanTeamName = teamName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
              const generatedId = `team-${cleanTeamName}-${gameId}`;
              
              team = {
                  id: generatedId,
                  gameId,
                  name: teamName,
                  joinCode: getJoinCode(teamName),
                  members: [{ name: playerName, photo: playerPhoto || undefined, deviceId }],
                  score: 0,
                  updatedAt: new Date().toISOString(),
                  captainDeviceId: deviceId,
                  isStarted: false
              };
          }

          await db.registerTeam(team);
          setCurrentTeam(team);
          setTargetTeamId(team.id);
          setIsCaptain(team.captainDeviceId === deviceId);
          teamSync.connect(team.gameId, team.name, playerName);
          setViewStep('TEAM_LOBBY');
      } catch (e) {
          console.error(e);
          alert("Failed to sync team lobby.");
      } finally { setIsLoading(false); }
  };

  const handleStartMission = async () => {
      if (!targetTeamId) return;
      setIsLoading(true);
      try {
          await db.updateTeamStatus(targetTeamId, true);
          onStartGame(selectedGameId, teamName, playerName, 'osm');
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
  };

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const goBack = () => {
      if (viewStep === 'MEMBER_DETAILS') setViewStep('CHOICE');
      else if (viewStep === 'JOIN_OPTIONS') setViewStep('CHOICE');
      else if (viewStep === 'JOIN_CODE') setViewStep('JOIN_OPTIONS');
      else if (viewStep === 'TAKE_PHOTO') setViewStep('MEMBER_DETAILS');
      else if (viewStep === 'TEAM_LOBBY') { setViewStep('CHOICE'); teamSync.disconnect(); }
      else if (onBack) onBack();
  };

  if (viewStep === 'CHOICE') {
      return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 text-white flex flex-col items-center justify-center p-6 uppercase font-sans relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
            <div className="absolute top-4 left-4 z-10"><button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full text-white font-black text-[10px] tracking-widest uppercase hover:bg-slate-700"><Home className="w-4 h-4" /> HUB</button></div>
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-4 transform rotate-3 relative z-10"><MapPin className="w-10 h-10 text-white" /></div>
            <h1 className="text-4xl font-black mb-12 tracking-[0.2em] text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 uppercase leading-tight relative z-10">CHOOSE YOUR PATH</h1>
            <div className="flex flex-col gap-6 w-full max-w-sm relative z-10">
                <button onClick={() => { setIsJoiningExisting(false); setViewStep('MEMBER_DETAILS'); }} className="group relative h-44 bg-orange-600 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:scale-[1.03] active:scale-95 border-2 border-orange-500/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-700 opacity-90" />
                    <div className="relative z-10 flex flex-col items-center">
                        <Users className="w-12 h-12 mb-2 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-black tracking-[0.2em] uppercase">CREATE TEAM</span>
                        <span className="text-[10px] font-bold opacity-60 mt-1 text-center">FIRST PERSON JOINS HERE</span>
                    </div>
                </button>
                <div className="flex items-center gap-4 text-slate-800 font-black text-[10px] tracking-widest"><div className="h-px bg-slate-800 flex-1"></div>OR<div className="h-px bg-slate-800 flex-1"></div></div>
                <button onClick={() => setViewStep('JOIN_OPTIONS')} className="group relative h-44 bg-slate-900 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:scale-[1.03] active:scale-95 border-2 border-slate-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-90" />
                    <div className="relative z-10 flex flex-col items-center">
                        <Hash className="w-12 h-12 mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-black tracking-[0.2em] uppercase">JOIN TEAM</span>
                        <span className="text-[10px] font-bold opacity-60 mt-1">USING CODE OR QR</span>
                    </div>
                </button>
            </div>
        </div>
      );
  }

  if (viewStep === 'MEMBER_DETAILS') {
      return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 text-white overflow-y-auto uppercase font-sans relative">
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
            <div className="min-h-full flex flex-col items-center justify-center p-4 max-w-lg mx-auto relative z-10">
                <button onClick={goBack} className="absolute top-4 left-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-white transition-all"><ArrowLeft className="w-6 h-6" /></button>
                <div className="text-center mb-6 mt-4 animate-in slide-in-from-top-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-4 transform rotate-3"><User className="w-10 h-10 text-white" /></div>
                    <h1 className="text-4xl font-black tracking-tight mb-1 text-white">{isJoiningExisting ? 'JOIN MISSION' : 'NEW TEAM'}</h1>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">IDENTIFY YOURSELF</p>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
                    <div className="space-y-6 relative z-10">
                        {!isJoiningExisting && (
                            <>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">SELECT GAME</label>
                                    <div className="relative"><select value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white font-black tracking-widest outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer uppercase text-xs">
                                        {availableGames.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                                    </select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" /></div>
                                </div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">TEAM NAME</label>
                                    <div className="relative"><Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" /><input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="ENTER TEAM NAME..." className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white font-black tracking-[0.2em] text-xs outline-none focus:border-orange-500 transition-all uppercase" /></div>
                                </div>
                            </>
                        )}
                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">YOUR NAME</label>
                            <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" /><input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="OPERATIVE NAME..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800 border-2 border-orange-500/50 text-white font-black tracking-[0.2em] text-xs placeholder:text-slate-600 outline-none focus:border-orange-500 transition-all uppercase" /></div>
                        </div>
                        <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">PROFILE PHOTO</label>
                            {playerPhoto ? (
                                <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-800 group cursor-pointer border-2 border-slate-700" onClick={() => setViewStep('TAKE_PHOTO')}>
                                    <img src={playerPhoto} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><RotateCcw className="w-8 h-8 text-white" /></div>
                                </div>
                            ) : (
                                <button onClick={() => setViewStep('TAKE_PHOTO')} className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-600 hover:bg-slate-800 hover:text-orange-500 hover:border-orange-500 transition-all uppercase font-black tracking-widest"><Camera className="w-8 h-8 mb-1" /><span className="text-[9px] font-black tracking-[0.3em]">TAKE PROFILE PHOTO</span></button>
                            )}
                        </div>
                    </div>
                    <button onClick={handleEnterLobby} disabled={!playerName || (!isJoiningExisting && !teamName) || isLoading} className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mt-8 relative z-10 bg-gradient-to-r from-orange-600 to-red-600 text-white">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isJoiningExisting ? 'SYNC & JOIN' : 'CREATE LOBBY'} <ArrowLeft className="w-6 h-6 rotate-180" /></>}
                    </button>
                </div>
            </div>
        </div>
      );
  }

  if (viewStep === 'JOIN_OPTIONS') {
      return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 text-white flex flex-col items-center justify-center p-6 uppercase font-sans animate-in fade-in relative">
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
            <div className="absolute top-4 left-4 z-10"><button onClick={goBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700"><ArrowLeft className="w-6 h-6" /></button></div>
            <h2 className="text-3xl font-black mb-12 tracking-[0.2em] uppercase text-center relative z-10">JOIN MISSION</h2>
            <div className="grid grid-cols-1 gap-6 w-full max-w-sm relative z-10">
                <button onClick={() => setViewStep('JOIN_CODE')} className="bg-slate-900 border-2 border-slate-800 p-10 rounded-3xl flex flex-col items-center gap-4 hover:border-orange-500 transition-all group shadow-xl">
                    <Hash className="w-14 h-14 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-black tracking-widest uppercase">ENTER TEAM CODE</span>
                </button>
            </div>
        </div>
      );
  }

  if (viewStep === 'JOIN_CODE') {
    return (
      <div className="fixed inset-0 z-[2000] bg-slate-950 text-white flex flex-col items-center justify-center p-6 uppercase font-sans animate-in zoom-in-95 relative">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
          <div className="absolute top-4 left-4 z-10"><button onClick={goBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700"><ArrowLeft className="w-6 h-6" /></button></div>
          <div className="w-full max-w-sm text-center relative z-10">
              <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-orange-500/50"><Hash className="w-10 h-10 text-orange-500" /></div>
              <h2 className="text-3xl font-black mb-4 tracking-[0.2em] uppercase">ENTER CODE</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">GET THE 6-DIGIT CODE FROM YOUR CAPTAIN</p>
              <div className="relative mb-8">
                  <input type="text" maxLength={6} value={manualCode} onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" className="w-full bg-slate-900 border-4 border-slate-800 rounded-2xl py-6 text-5xl font-mono font-black text-center text-white tracking-[0.3em] outline-none focus:border-orange-500 transition-all shadow-inner" autoFocus />
              </div>
              <button onClick={handleManualCodeSubmit} disabled={manualCode.length < 6 || isLoading} className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xl tracking-[0.2em] shadow-xl disabled:opacity-30 transition-all active:scale-95">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'VERIFY CODE'}
              </button>
          </div>
      </div>
    );
  }

  if (viewStep === 'TEAM_LOBBY') {
      const activeMembers = currentTeam?.members || [];
      return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 text-white flex flex-col font-sans relative overflow-hidden animate-in fade-in duration-500">
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
            
            {/* Lobby Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center z-10 shadow-xl">
                <div>
                    <h1 className="text-3xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{currentTeam?.name}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="bg-orange-600/20 text-orange-500 px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-2">
                            <Hash className="w-3 h-3" /><span className="text-[10px] font-black tracking-[0.2em] uppercase font-mono">{currentTeam?.joinCode}</span>
                        </div>
                        <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">{activeMembers.length} OPERATIVES</div>
                    </div>
                </div>
                <button onClick={goBack} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-white"><X className="w-6 h-6" /></button>
            </div>

            {/* Member Grid */}
            <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {activeMembers.map((member, i) => {
                        const isSelf = member.deviceId === teamSync.getDeviceId();
                        const isMemberCaptain = member.deviceId === currentTeam?.captainDeviceId;
                        return (
                            <div key={i} onClick={() => isSelf && setViewStep('TAKE_PHOTO')} className={`group relative bg-slate-900 border-2 rounded-[2.5rem] p-6 shadow-2xl transition-all ${isSelf ? 'border-orange-500 ring-4 ring-orange-500/10 cursor-pointer hover:scale-105' : 'border-slate-800 hover:border-slate-700'}`}>
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/footprints.png')]" />
                                
                                {isMemberCaptain && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full font-black text-[9px] tracking-[0.2em] flex items-center gap-2 shadow-lg border border-orange-400 uppercase z-20">
                                        <Shield className="w-3 h-3" /> CAPTAIN
                                    </div>
                                )}

                                <div className="flex flex-col items-center">
                                    <div className={`w-32 h-32 rounded-full mb-4 border-4 overflow-hidden shadow-inner bg-slate-800 ${isSelf ? 'border-orange-500' : 'border-slate-700'}`}>
                                        {member.photo ? <img src={member.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-slate-700" /></div>}
                                        {isSelf && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><RotateCcw className="w-8 h-8 text-white" /></div>}
                                    </div>
                                    <h3 className={`text-xl font-black tracking-widest uppercase text-center ${isSelf ? 'text-white' : 'text-slate-400'}`}>{member.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-green-500 tracking-widest uppercase">READY</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 z-20 flex justify-center">
                {isCaptain ? (
                    <div className="w-full max-w-sm flex flex-col gap-4">
                        <p className="text-center text-[10px] text-orange-500 font-black tracking-[0.3em] uppercase">TEAM ASSEMBLED? START THE MISSION</p>
                        <button onClick={handleStartMission} disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl font-black text-xl tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>START MISSION <Play className="w-8 h-8" /></>}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase text-center">WAITING FOR CAPTAIN TO START MISSION</span>
                    </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[2100] bg-black text-white flex flex-col uppercase font-sans overflow-hidden">
        <div className="relative flex-1 overflow-hidden">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted autoPlay playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-full border-dashed animate-spin-slow pointer-events-none" />
        </div>
        <div className="p-8 bg-slate-950 border-t border-slate-800 flex justify-between items-center relative shadow-2xl">
            <button onClick={goBack} className="p-4 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all"><X className="w-8 h-8" /></button>
            <button onClick={handleCapturePhoto} className="w-24 h-24 rounded-full border-[6px] border-white bg-white/20 hover:bg-white/40 transition-all transform active:scale-90 shadow-2xl"></button>
            <button onClick={toggleCamera} className="p-4 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all"><RotateCcw className="w-8 h-8" /></button>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded-xl font-black text-xs tracking-widest shadow-xl">ALIGN FACE IN CENTER</div>
        </div>
    </div>
  );
};

export default WelcomeScreen;
