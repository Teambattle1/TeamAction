
import React from 'react';
import { GamePoint } from '../types';
import { ICON_COMPONENTS } from '../utils/icons';
import { Edit2, Trash2, X, Target, MousePointer2 } from 'lucide-react';

interface TaskPreviewProps {
  point: GamePoint;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({ point, onEdit, onDelete, onClose }) => {
  const Icon = ICON_COMPONENTS[point.iconId];

  // Helper to strip HTML tags for preview
  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

  return (
    <div className="absolute bottom-24 left-4 right-4 z-[500] flex justify-center pointer-events-none">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 flex flex-col pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header Bar */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 flex justify-center border-b border-gray-100 dark:border-gray-800">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="p-4">
            <div className="flex items-start gap-4">
                {/* Icon Box */}
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                    <Icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-2">{point.title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                        {stripHtml(point.task.question)}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide border border-gray-200 dark:border-gray-700">
                            <MousePointer2 className="w-3 h-3" /> {point.task.type.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide border border-gray-200 dark:border-gray-700">
                            <Target className="w-3 h-3" /> {point.radiusMeters}m Radius
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 gap-3 mt-5">
                <button 
                    onClick={onDelete}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors uppercase tracking-wide"
                >
                    <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button 
                    onClick={onEdit}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-colors uppercase tracking-wide"
                >
                    <Edit2 className="w-4 h-4" /> Edit Task
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPreview;
