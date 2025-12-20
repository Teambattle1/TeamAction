
import React, { useState } from 'react';
import { Game } from '../types';
import { X, Trash2, Calendar, MapPin, Database, AlertTriangle } from 'lucide-react';

interface AdminModalProps {
  games: Game[];
  onClose: () => void;
  onDeleteGame: (id: string) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ games, onClose, onDeleteGame }) => {
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
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Database className="w-5 h-5 text-red-500"/> ADMIN
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">MANAGE GAMES</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
          {games.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold uppercase tracking-wide text-sm">NO GAMES FOUND</p>
            </div>
          )}

          {games.map(game => (
            <div key={game.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between group hover:border-slate-600 transition-colors">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-white truncate text-base mb-1 uppercase">{game.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium uppercase">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(game.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {game.points.length} TASKS</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleDeleteClick(game.id)}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold uppercase text-xs tracking-wider ${deleteConfirmId === game.id ? 'bg-red-600 text-white w-24 justify-center' : 'bg-slate-700 text-slate-400 hover:bg-red-900/30 hover:text-red-400'}`}
              >
                {deleteConfirmId === game.id ? (
                  "CONFIRM"
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertTriangle className="w-3 h-3" /> WARNING: DELETING A GAME CANNOT BE UNDONE
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
