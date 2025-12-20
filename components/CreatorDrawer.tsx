
import React from 'react';
import { X, Plus, Gamepad2, FilePlus, Layers } from 'lucide-react';

interface CreatorDrawerProps {
  onClose: () => void;
  onCreateGame: () => void;
  onCreateTask: () => void;
  onCreateList: () => void;
}

const CreatorDrawer: React.FC<CreatorDrawerProps> = ({ onClose, onCreateGame, onCreateTask, onCreateList }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1200] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl rounded-t-3xl animate-in slide-in-from-bottom duration-300">
      <div className="p-2 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="px-6 pb-8 pt-2">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-500" /> Create New
            </h2>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
            <button 
                onClick={onCreateGame}
                className="flex flex-col items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors group"
            >
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-200 group-hover:scale-110 transition-transform shadow-sm">
                    <Gamepad2 className="w-7 h-7" />
                </div>
                <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide">Game</span>
            </button>

            <button 
                onClick={onCreateTask}
                className="flex flex-col items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
            >
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 group-hover:scale-110 transition-transform shadow-sm">
                    <FilePlus className="w-7 h-7" />
                </div>
                <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide">Task</span>
            </button>

            <button 
                onClick={onCreateList}
                className="flex flex-col items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group"
            >
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-200 group-hover:scale-110 transition-transform shadow-sm">
                    <Layers className="w-7 h-7" />
                </div>
                <span className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide">List</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreatorDrawer;
