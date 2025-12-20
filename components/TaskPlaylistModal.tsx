import React, { useState } from 'react';
import { GamePoint } from '../types';
import { ICON_COMPONENTS } from '../utils/icons';
import { 
    DndContext, 
    closestCenter, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors, 
    DragEndEvent 
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy, 
    useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Wand2, Edit2, Trash2, X, Move, Split, Layers, Type } from 'lucide-react';

interface TaskPlaylistModalProps {
    points: GamePoint[];
    onReorder: (points: GamePoint[]) => void;
    onClose: () => void;
    onEditTask: (point: GamePoint) => void;
    onDeleteTask: (id: string) => void;
    onInsertTask: (index: number) => void; // Trigger generic insert (opens library/AI)
    onAddDivider: (index: number) => void;
}

const stripHtml = (html: any) => typeof html === 'string' ? html.replace(/<[^>]*>?/gm, '') : '';

interface SortableItemProps {
    id: string;
    point: GamePoint;
    index: number;
    onEdit: (point: GamePoint) => void;
    onDelete: (id: string) => void;
    onInsert: (index: number) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, point, index, onEdit, onDelete, onInsert }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const Icon = ICON_COMPONENTS[point.iconId] || Type;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group mb-2">
            {/* Insert Trigger (Top) */}
            <div className="absolute -top-3 left-0 right-0 h-4 opacity-0 group-hover:opacity-100 flex items-center justify-center z-10 transition-opacity">
                 <button 
                    onClick={() => onInsert(index)}
                    className="w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                    title="Insert Before"
                 >
                     <Plus className="w-4 h-4" />
                 </button>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 bg-white dark:bg-gray-800 ${point.isSectionHeader ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div {...attributes} {...listeners} className="text-gray-400 cursor-grab active:cursor-grabbing p-1">
                    <GripVertical className="w-4 h-4" />
                </div>
                
                <div className={`p-2 rounded-lg ${point.isSectionHeader ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {point.isSectionHeader ? <Split className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm truncate ${point.isSectionHeader ? 'text-orange-700 dark:text-orange-400 uppercase tracking-wide' : 'text-gray-800 dark:text-gray-200'}`}>
                        {point.title}
                    </h4>
                    {!point.isSectionHeader && (
                        <p className="text-xs text-gray-500 truncate">{stripHtml(point.task.question)}</p>
                    )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(point)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(point.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
            
            {/* Insert Trigger (Bottom - only for last item) */}
        </div>
    );
};

const TaskPlaylistModal: React.FC<TaskPlaylistModalProps> = ({ points, onReorder, onClose, onEditTask, onDeleteTask, onInsertTask, onAddDivider }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = points.findIndex((p) => p.id === active.id);
            const newIndex = points.findIndex((p) => p.id === over.id);
            onReorder(arrayMove(points, oldIndex, newIndex));
        }
    };

    return (
        <div className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <Layers className="w-5 h-5" /> Task Playlist
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={points.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            {points.map((point, index) => (
                                <SortableItem 
                                    key={point.id}
                                    id={point.id}
                                    point={point}
                                    index={index}
                                    onEdit={onEditTask}
                                    onDelete={onDeleteTask}
                                    onInsert={onInsertTask}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    
                    <button 
                        onClick={() => onInsertTask(points.length)}
                        className="w-full py-3 mt-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-400 font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Add Task at End
                    </button>
                </div>

                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-2">
                    <button 
                        onClick={() => onAddDivider(points.length)}
                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <Split className="w-4 h-4" /> Add Section
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl uppercase tracking-wide hover:bg-blue-700 shadow-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskPlaylistModal;