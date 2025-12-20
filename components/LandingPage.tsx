
import React from 'react';
import { Users, Plus, Library, Map, Database } from 'lucide-react';

interface LandingPageProps {
  onAction: (action: 'CREATE' | 'EDIT' | 'TEAM' | 'TASKS' | 'ADMIN') => void;
  onHome: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAction }) => {
  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 font-sans uppercase animate-in fade-in duration-300">
      
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 relative">
          
          <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2">CREATOR HUB</h1>
              <p className="text-xs text-slate-500 font-bold tracking-widest">TEAMBATTLE</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* CREATE BUTTON */}
              <button 
                onClick={() => onAction('CREATE')}
                className="group relative h-40 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
              >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <Plus className="w-12 h-12 text-green-100 mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <span className="text-xl font-black text-white tracking-widest relative z-10">CREATE</span>
                  <span className="text-[10px] font-bold text-green-200 mt-1 opacity-70 group-hover:opacity-100">NEW GAME / LIST</span>
              </button>

              {/* EDIT BUTTON */}
              <button 
                onClick={() => onAction('EDIT')}
                className="group relative h-40 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
              >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <Map className="w-12 h-12 text-blue-100 mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <span className="text-xl font-black text-white tracking-widest relative z-10">EDIT</span>
                  <span className="text-[10px] font-bold text-blue-200 mt-1 opacity-70 group-hover:opacity-100">MAP & TASKS</span>
              </button>

              {/* TEAM BUTTON */}
              <button 
                onClick={() => onAction('TEAM')}
                className="group relative h-40 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
              >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <Users className="w-8 h-8 text-orange-100 mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black text-white tracking-widest relative z-10">TEAM</span>
                  <span className="text-[10px] font-bold text-orange-200 mt-1 opacity-70 group-hover:opacity-100">LOBBY & PLAYERS</span>
              </button>

              {/* TASKS BUTTON */}
              <button 
                onClick={() => onAction('TASKS')}
                className="group relative h-40 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
              >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <Library className="w-8 h-8 text-purple-100 mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-black text-white tracking-widest relative z-10">TASKS</span>
                  <span className="text-[10px] font-bold text-purple-200 mt-1 opacity-70 group-hover:opacity-100">LIBRARY</span>
              </button>

              {/* ADMIN BUTTON (Full Width) */}
              <button 
                onClick={() => onAction('ADMIN')}
                className="col-span-2 group relative h-16 bg-slate-800 border border-slate-700 rounded-2xl flex flex-row items-center justify-center gap-3 overflow-hidden shadow-md transition-all hover:bg-slate-700 hover:border-slate-600"
              >
                  <Database className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  <span className="text-sm font-black text-slate-300 group-hover:text-white tracking-widest uppercase">ADMIN / MANAGE GAMES</span>
              </button>
          </div>
      </div>
    </div>
  );
};

export default LandingPage;
