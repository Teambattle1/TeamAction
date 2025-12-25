
import React from 'react';
import { Map, MessageSquare, Trophy, PlusCircle, LogOut, User } from 'lucide-react';
import { AuthUser } from '../types';

interface InstructorMobileDashboardProps {
    user: AuthUser;
    onAction: (action: 'MAP' | 'CHAT' | 'RANKING' | 'SCORE') => void;
    onLogout: () => void;
    activeGameName: string;
}

const InstructorMobileDashboard: React.FC<InstructorMobileDashboardProps> = ({ user, onAction, onLogout, activeGameName }) => {
    return (
        <div className="fixed inset-0 z-[4000] bg-slate-950 flex flex-col text-white font-sans">
            {/* Header */}
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-widest text-white">INSTRUCTOR</h1>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{activeGameName || "NO ACTIVE GAME"}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-300">{user.name}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">{user.role}</span>
                    </div>
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                        <User className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Grid Buttons */}
            <div className="flex-1 p-6 grid grid-cols-2 gap-4 content-center">
                <button 
                    onClick={() => onAction('MAP')}
                    className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:border-blue-500/50 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Map className="w-8 h-8 text-blue-500" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">MAP VIEW</span>
                </button>

                <button 
                    onClick={() => onAction('CHAT')}
                    className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:border-green-500/50 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-8 h-8 text-green-500" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">CHAT</span>
                </button>

                <button 
                    onClick={() => onAction('RANKING')}
                    className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:border-yellow-500/50 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 bg-yellow-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">RANKING</span>
                </button>

                <button 
                    onClick={() => onAction('SCORE')}
                    className="aspect-square bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:border-red-500/50 transition-all shadow-xl group"
                >
                    <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlusCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">SCORE</span>
                </button>
            </div>

            {/* Footer */}
            <div className="p-6">
                <button 
                    onClick={onLogout}
                    className="w-full py-4 bg-slate-900 border border-slate-800 text-slate-400 font-black uppercase tracking-widest rounded-xl hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> LOGOUT
                </button>
            </div>
        </div>
    );
};

export default InstructorMobileDashboard;
