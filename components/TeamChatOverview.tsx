
import React, { useState, useMemo } from 'react';
import { Team } from '../types';
import { X, MessageSquare, CheckCircle, Circle, Trophy, Users, CheckSquare, Square } from 'lucide-react';

interface TeamChatOverviewProps {
  teams: Team[];
  onClose: () => void;
  onChatWithTeams: (teamIds: string[] | null) => void; // null = global
}

const TeamChatOverview: React.FC<TeamChatOverviewProps> = ({ teams, onClose, onChatWithTeams }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sortedTeams = useMemo(() => {
      return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  const toggleSelect = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === teams.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(teams.map(t => t.id)));
      }
  };

  const handleBroadcastSelected = () => {
      if (selectedIds.size === 0) return;
      onChatWithTeams(Array.from(selectedIds));
  };

  const handleBroadcastAll = () => {
      onChatWithTeams(null); // Global
  };

  return (
    <div className="fixed inset-0 z-[4500] bg-slate-950/95 backdrop-blur-sm flex flex-col font-sans animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                    <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">COMMS CENTER</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">TEAM OVERVIEW & BROADCAST</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-800">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-900">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors"
                >
                    {selectedIds.size === teams.length ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
                    {selectedIds.size === teams.length ? 'DESELECT ALL' : 'SELECT ALL TEAMS'}
                </button>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{teams.length} ACTIVE TEAMS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedTeams.map((team, idx) => {
                    const isSelected = selectedIds.has(team.id);
                    const rank = idx + 1;

                    return (
                        <div 
                            key={team.id}
                            className={`relative bg-slate-800 border rounded-2xl overflow-hidden transition-all group ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-700 hover:border-slate-600'}`}
                        >
                            {/* Card Header / Image */}
                            <div 
                                onClick={() => toggleSelect(team.id)}
                                className="h-32 bg-slate-900 relative cursor-pointer group-hover:opacity-90 transition-opacity"
                            >
                                {team.photoUrl ? (
                                    <img src={team.photoUrl} className="w-full h-full object-cover" alt={team.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#0a0f1d]">
                                        <Users className="w-12 h-12 text-slate-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                                
                                {/* Rank Badge */}
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${rank === 1 ? 'bg-yellow-500 text-black' : (rank === 2 ? 'bg-gray-300 text-black' : (rank === 3 ? 'bg-amber-700 text-white' : 'bg-black/60 text-white border border-white/10'))}`}>
                                        #{rank}
                                    </span>
                                </div>

                                {/* Selection Check */}
                                <div className="absolute top-2 right-2">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-black/40 border-white/30 text-transparent hover:border-white'}`}>
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="absolute bottom-3 left-4 right-4">
                                    <h3 className="text-white font-black uppercase tracking-wide truncate text-lg shadow-black drop-shadow-md">{team.name}</h3>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{team.score} PTS</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
                                <button 
                                    onClick={() => onChatWithTeams([team.id])}
                                    className="flex-1 py-2 bg-slate-700 hover:bg-white hover:text-black text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-3 h-3" /> CHAT
                                </button>
                                <button 
                                    onClick={() => toggleSelect(team.id)}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${isSelected ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' : 'bg-transparent border-slate-600 text-slate-500 hover:text-white hover:border-white'}`}
                                >
                                    {isSelected ? 'MARKED' : 'MARK'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 shrink-0 flex justify-between items-center gap-6">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {selectedIds.size} TEAMS MARKED
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={handleBroadcastAll}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-black uppercase text-xs tracking-widest transition-all"
                >
                    BROADCAST TO ALL
                </button>
                <button 
                    onClick={handleBroadcastSelected}
                    disabled={selectedIds.size === 0}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                >
                    <MessageSquare className="w-4 h-4" />
                    CHAT WITH MARKED
                </button>
            </div>
        </div>
    </div>
  );
};

export default TeamChatOverview;
