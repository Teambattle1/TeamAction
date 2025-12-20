
import React from 'react';
import { GamePoint } from '../types';
import { ICON_COMPONENTS } from '../utils/icons';
import { Edit2, Trash2, X, Target, MousePointer2, Award } from 'lucide-react';

interface TaskPreviewProps {
  point: GamePoint;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({ point, onEdit, onDelete, onClose, onMouseEnter, onMouseLeave }) => {
  const Icon = ICON_COMPONENTS[point.iconId];

  // Helper to strip HTML tags for preview
  const stripHtml = (html: any) => typeof html === 'string' ? html.replace(/<[^>]*>?/gm, '') : '';

  return (
    <div className="absolute bottom-24 left-4 right-4 z-[1200] flex justify-center pointer-events-none">
        <div 
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 w-full max-w-sm border border-gray-200 dark:border-gray-700 pointer-events-auto animate-in slide-in-from-bottom-5"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{point.title}</h3>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide flex items-center gap-1">
                            <Target className="w-3 h-3" /> {point.activationTypes.join(', ')}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 h-10">
                {stripHtml(point.task.question) || "No description provided."}
            </p>

            <div className="flex gap-2">
                <button 
                    onClick={onEdit}
                    className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                    <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                    onClick={onDelete}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> Delete
                </button>
            </div>
        </div>
    </div>
  );
};

export default TaskPreview;
