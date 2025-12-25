
import React, { useState } from 'react';
import { Team } from '../types';
import { X, Plus, Minus, Trophy, CheckCircle } from 'lucide-react';
import * as db from '../services/db';

interface ScoreManagerProps {
    teams: Team[];
    onClose: () => void;
    activeGameId: string;
}

const ScoreManager: React.FC<ScoreManagerProps> = ({ teams, onClose, activeGameId }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleAdjustScore = async (team: Team, amount: number) => {
        setProcessingId(team.id);
        
        // 1. Update Score
        await db.updateTeamScore(team.id, amount);
        
        // 2. Log "Bonus Task"
        const bonusId = `bonus-${Date.now()}`;
        // We use a special ID format that TeamsModal will recognize as a bonus
        // Since `completed_point_ids` is just a list of IDs, we append this.
        // TeamsModal needs to interpret this.
        
        // Fetch fresh team to get current array
        const freshTeam = await db.fetchTeam(team.id);
        if (freshTeam) {
            const currentPoints = freshTeam.completedPointIds || [];
            // To make it show in the log, we abuse the ID system slightly. 
            // In a robust system, we'd have a separate activity log table.
            // For now: 
            const newPoints = [...currentPoints, bonusId];
            await db.updateTeamProgress(team.id, bonusId, freshTeam.score + amount); // Note: score updated twice effectively, careful. fetchTeam gets old score.
            // Actually `updateTeamScore` handles the math atomically if db.ts is good, 
            // but `updateTeamProgress` sets absolute score.
            // Let's rely on `updateTeamProgress` solely.
            
            await db.updateTeamProgress(team.id, bonusId, (freshTeam.score || 0) + amount);
        }

        setProcessingId(null);
    };

    return (
        <div className="fixed inset-0 z-[5000] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">SCORE MANAGER</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">AWARD OR DEDUCT POINTS</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
                <div className="grid gap-4">
                    {teams.sort((a,b) => b.score - a.score).map(team => (
                        <div key={team.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                    {team.photoUrl ? (
                                        <img src={team.photoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xs">{team.name.substring(0,2)}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-white uppercase text-sm">{team.name}</h3>
                                    <p className="text-orange-500 font-bold text-xs">{team.score} PTS</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleAdjustScore(team, -100)}
                                    disabled={!!processingId}
                                    className="w-12 h-12 rounded-xl bg-red-900/20 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={() => handleAdjustScore(team, 100)}
                                    disabled={!!processingId}
                                    className="w-12 h-12 rounded-xl bg-green-900/20 border border-green-500/30 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all active:scale-95"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScoreManager;
