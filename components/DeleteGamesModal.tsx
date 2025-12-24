
import React, { useState } from 'react';
import { Game } from '../types';
import { X, Trash2, Calendar, MapPin, AlertTriangle, Gamepad2 } from 'lucide-react';

interface DeleteGamesModalProps {
  games: Game[];
  onClose: () => void;
  onDeleteGame: (id: string) => void;
}

const DeleteGamesModal: React.FC<DeleteGamesModalProps> = ({ games, onClose, onDeleteGame }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteGame(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000); // Reset confirm after 3s
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-900/50 w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500"/> DELETE GAMES
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">PERMANENTLY REMOVE SESSIONS</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-900/20 border-b border-red-900/30 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-wide mb-1">WARNING: IRREVERSIBLE ACTION</p>
                <p className="text-[10px] text-red-300/70 leading-relaxed font-medium">
                    Deleting a game will remove all associated teams, scores, and mission data from the database immediately. This cannot be undone.
                </p>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900 custom-scrollbar">
          {games.length === 0 && (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <Gamepad2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold uppercase tracking-wide text-sm">NO GAMES FOUND</p>
            </div>
          )}

          {games.map(game => (
            <div key={game.id} className={`bg-slate-800 rounded-xl p-4 border transition-all flex items-center justify-between group ${deleteConfirmId === game.id ? 'border-red-500 bg-red-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-white truncate text-base mb-1 uppercase">{game.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium uppercase">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(game.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {game.points.length} TASKS</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleDeleteClick(game.id)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold uppercase text-xs tracking-wider shadow-lg ${deleteConfirmId === game.id ? 'bg-red-600 text-white w-28 justify-center animate-pulse' : 'bg-slate-700 text-slate-400 hover:bg-red-900/30 hover:text-red-400'}`}
              >
                {deleteConfirmId === game.id ? (
                  "CONFIRM?"
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
            <button onClick={onClose} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                CANCEL & CLOSE
            </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGamesModal;
