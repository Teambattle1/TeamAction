// This is a temporary file to hold the new task list rendering logic
// It will be integrated back into PlaygroundEditor.tsx

const renderTaskListNew = () => {
    // Helper function to get original task index
    const getOriginalTaskIndex = (taskId: string): number => {
        return uniquePlaygroundPoints.findIndex(p => p.id === taskId);
    };

    // Helper function to render a single task item
    const renderTaskItem = (
        point: GamePoint,
        renderContext: {
            isNested?: boolean;
            sourceTask?: GamePoint;
            actionType?: 'onOpen' | 'onCorrect' | 'onIncorrect';
        } = {}
    ) => {
        const { isNested = false, sourceTask, actionType } = renderContext;
        const originalIndex = getOriginalTaskIndex(point.id);
        const taskNumber = String(originalIndex + 1).padStart(2, '0');

        // Calculate action info
        const hasSourceOnOpen = point.logic?.onOpen?.length > 0;
        const hasSourceOnCorrect = point.logic?.onCorrect?.length > 0;
        const hasSourceOnIncorrect = point.logic?.onIncorrect?.length > 0;

        const hasTargetOnOpen = uniquePlaygroundPoints.some(p =>
            p.id !== point.id && p.logic?.onOpen?.some((a: any) => (a.targetId || a) === point.id)
        );
        const hasTargetOnCorrect = uniquePlaygroundPoints.some(p =>
            p.id !== point.id && p.logic?.onCorrect?.some((a: any) => (a.targetId || a) === point.id)
        );
        const hasTargetOnIncorrect = uniquePlaygroundPoints.some(p =>
            p.id !== point.id && p.logic?.onIncorrect?.some((a: any) => (a.targetId || a) === point.id)
        );

        const isMarked = markedTaskIds.has(point.id);
        const isHovered = hoveredTaskId === point.id;
        const hasActions = hasSourceOnOpen || hasSourceOnCorrect || hasSourceOnIncorrect;
        const isSourceTask = taskSortMode === 'actions' && hasActions && !isNested;

        const uniqueKey = isNested
            ? `${point.id}-nested-${sourceTask?.id}-${actionType}`
            : point.id;

        return (
            <div
                key={uniqueKey}
                className={`px-3 py-2 border rounded transition-colors group flex items-center gap-2 ${
                    isNested ? 'ml-6 border-l-2' : ''
                } ${
                    bulkIconMode
                        ? bulkIconSourceId === point.id
                            ? 'bg-blue-500/20 border-blue-500 cursor-pointer'
                            : 'bg-slate-800/50 border-slate-700 cursor-pointer'
                        : (isHovered
                            ? 'bg-orange-500/20 border-orange-500'
                            : isMarked
                            ? 'bg-orange-500/20 border-orange-500'
                            : 'bg-slate-800/50 border-slate-700 hover:border-orange-500 hover:bg-slate-800')
                }`}
                onMouseEnter={() => setHoveredTaskId(point.id)}
                onMouseLeave={() => setHoveredTaskId(null)}
                onClick={() => {
                    if (bulkIconMode) {
                        if (bulkIconSourceId === null) {
                            setBulkIconSourceId(point.id);
                        } else if (bulkIconSourceId === point.id) {
                            setBulkIconSourceId(null);
                        } else {
                            toggleBulkIconTarget(point.id);
                        }
                    } else {
                        setSelectedTaskId(point.id);
                    }
                }}
            >
                {/* Checkbox for bulk/mark mode */}
                {bulkIconMode ? (
                    <>
                        {bulkIconSourceId === null ? (
                            <div className="w-6 h-6 bg-blue-900/50 border-2 border-blue-400 rounded flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-blue-300 cursor-pointer hover:bg-blue-800/50">
                                📌
                            </div>
                        ) : bulkIconSourceId === point.id ? (
                            <div className="w-6 h-6 bg-blue-600 border-2 border-blue-400 rounded flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
                                {point.iconUrl ? (
                                    <img src={point.iconUrl} alt="" className="w-4 h-4 object-contain" />
                                ) : (
                                    (() => {
                                        const Icon = ICON_COMPONENTS[point.iconId] || ICON_COMPONENTS.default;
                                        return <Icon className="w-4 h-4 text-white" />;
                                    })()
                                )}
                            </div>
                        ) : (
                            <input
                                type="checkbox"
                                checked={bulkIconTargets.has(point.id)}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    toggleBulkIconTarget(point.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-2 border-orange-500 bg-slate-900 cursor-pointer accent-orange-500 flex-shrink-0"
                                title="Click checkbox or task to select target"
                            />
                        )}
                    </>
                ) : isMarkMode && (
                    <input
                        type="checkbox"
                        checked={isMarked}
                        onChange={(e) => {
                            e.stopPropagation();
                            toggleMarkTask(point.id);
                        }}
                        className="w-4 h-4 rounded border-2 border-orange-400 bg-slate-900 cursor-pointer accent-orange-500 flex-shrink-0"
                        title="Mark for snapping"
                    />
                )}

                {/* Icon */}
                <div className="w-5 h-5 bg-slate-700 rounded flex items-center justify-center flex-shrink-0 border border-slate-600">
                    {point.iconUrl ? (
                        <img src={point.iconUrl} alt="" className="w-3 h-3 object-contain" />
                    ) : (
                        (() => {
                            const Icon = ICON_COMPONENTS[point.iconId] || ICON_COMPONENTS.default;
                            return <Icon className="w-3 h-3 text-slate-400" />;
                        })()
                    )}
                </div>

                {/* Task number and title on one line */}
                <div className="flex-1 min-w-0">
                    {editingTitleId === point.id ? (
                        <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onBlur={() => {
                                if (editingTitleValue.trim()) {
                                    updatePointDirectly(point.id, { title: editingTitleValue });
                                }
                                setEditingTitleId(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (editingTitleValue.trim()) {
                                        updatePointDirectly(point.id, { title: editingTitleValue });
                                    }
                                    setEditingTitleId(null);
                                } else if (e.key === 'Escape') {
                                    setEditingTitleId(null);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-slate-700 border border-orange-500 rounded px-1.5 py-0.5 text-[11px] font-bold text-white outline-none focus:border-orange-400"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center gap-2 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase flex-shrink-0">TASK {taskNumber}</p>
                            <p
                                className="text-[11px] font-bold text-white truncate group-hover:text-orange-300 transition-colors cursor-text flex-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTitleId(point.id);
                                    setEditingTitleValue(point.title);
                                }}
                                title="Click to edit task title"
                            >
                                {point.title}
                            </p>
                        </div>
                    )}
                </div>

                {/* Score */}
                {showTaskScores && (
                    <p className="text-[10px] font-bold text-orange-400 uppercase flex-shrink-0">
                        ${point.points}
                    </p>
                )}

                {/* Action indicators - tri-color system */}
                {showTaskActions && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* SOURCE indicators (this task triggers actions) */}
                        {hasSourceOnOpen && (
                            <div
                                className={`w-2 h-2 rounded-full bg-yellow-400 border-2 border-yellow-600 ${isSourceTask ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-800' : ''}}`}
                                title="SOURCE: When Opened action"
                            />
                        )}
                        {hasSourceOnCorrect && (
                            <div
                                className={`w-2 h-2 rounded-full bg-green-400 border-2 border-green-600 ${isSourceTask ? 'ring-2 ring-green-400 ring-offset-1 ring-offset-slate-800' : ''}}`}
                                title="SOURCE: If Correct action"
                            />
                        )}
                        {hasSourceOnIncorrect && (
                            <div
                                className={`w-2 h-2 rounded-full bg-red-400 border-2 border-red-600 ${isSourceTask ? 'ring-2 ring-red-400 ring-offset-1 ring-offset-slate-800' : ''}}`}
                                title="SOURCE: If Incorrect action"
                            />
                        )}

                        {/* Divider if both source and target */}
                        {(hasSourceOnOpen || hasSourceOnCorrect || hasSourceOnIncorrect) &&
                         (hasTargetOnOpen || hasTargetOnCorrect || hasTargetOnIncorrect) && (
                            <div className="w-px h-3 bg-slate-600" />
                        )}

                        {/* TARGET indicators (other tasks point to this task) */}
                        {hasTargetOnOpen && (
                            <div
                                className="w-2 h-2 rounded-full bg-yellow-400/40 border border-yellow-500"
                                title="TARGET: Unlocked by 'When Opened' action"
                            />
                        )}
                        {hasTargetOnCorrect && (
                            <div
                                className="w-2 h-2 rounded-full bg-green-400/40 border border-green-500"
                                title="TARGET: Unlocked by 'If Correct' action"
                            />
                        )}
                        {hasTargetOnIncorrect && (
                            <div
                                className="w-2 h-2 rounded-full bg-red-400/40 border border-red-500"
                                title="TARGET: Unlocked by 'If Incorrect' action"
                            />
                        )}
                    </div>
                )}

                {/* Edit button */}
                <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-500 transition-colors flex-shrink-0" />
            </div>
        );
    };

    if (taskSortMode === 'order') {
        // Simple list in original order
        return uniquePlaygroundPoints.map((point) => renderTaskItem(point));
    } else {
        // Hierarchical action-based view
        const renderedItems: JSX.Element[] = [];

        // First, render SOURCE tasks with their targets
        const sourceTasks = uniquePlaygroundPoints.filter(p => 
            p.logic?.onOpen?.length > 0 || 
            p.logic?.onCorrect?.length > 0 || 
            p.logic?.onIncorrect?.length > 0
        );

        if (sourceTasks.length > 0) {
            renderedItems.push(
                <div key="header-source" className="flex items-center gap-2 py-2 px-2 mt-3 mb-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        ⚡ SOURCE Tasks
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 via-transparent to-transparent" />
                </div>
            );

            sourceTasks.forEach(sourceTask => {
                const isCollapsed = collapsedSources.has(sourceTask.id);

                // Render source task with collapse/expand button
                renderedItems.push(
                    <div key={`source-${sourceTask.id}`} className="space-y-1">
                        <div className="flex items-start gap-1">
                            {/* Collapse/Expand button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newCollapsed = new Set(collapsedSources);
                                    if (isCollapsed) {
                                        newCollapsed.delete(sourceTask.id);
                                    } else {
                                        newCollapsed.add(sourceTask.id);
                                    }
                                    setCollapsedSources(newCollapsed);
                                }}
                                className="mt-2 p-1 rounded hover:bg-slate-700 transition-colors flex-shrink-0"
                                title={isCollapsed ? 'Expand to show target tasks' : 'Collapse to hide target tasks'}
                            >
                                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
                            </button>
                            <div className="flex-1">
                                {renderTaskItem(sourceTask)}
                            </div>
                        </div>

                        {/* Render target tasks when expanded */}
                        {!isCollapsed && (
                            <div className="space-y-1">
                                {/* onOpen targets */}
                                {sourceTask.logic?.onOpen?.map((action: any) => {
                                    const targetId = action.targetId || action;
                                    const targetTask = uniquePlaygroundPoints.find(p => p.id === targetId);
                                    if (!targetTask) return null;
                                    return renderTaskItem(targetTask, {
                                        isNested: true,
                                        sourceTask,
                                        actionType: 'onOpen'
                                    });
                                })}

                                {/* onCorrect targets */}
                                {sourceTask.logic?.onCorrect?.map((action: any) => {
                                    const targetId = action.targetId || action;
                                    const targetTask = uniquePlaygroundPoints.find(p => p.id === targetId);
                                    if (!targetTask) return null;
                                    return renderTaskItem(targetTask, {
                                        isNested: true,
                                        sourceTask,
                                        actionType: 'onCorrect'
                                    });
                                })}

                                {/* onIncorrect targets */}
                                {sourceTask.logic?.onIncorrect?.map((action: any) => {
                                    const targetId = action.targetId || action;
                                    const targetTask = uniquePlaygroundPoints.find(p => p.id === targetId);
                                    if (!targetTask) return null;
                                    return renderTaskItem(targetTask, {
                                        isNested: true,
                                        sourceTask,
                                        actionType: 'onIncorrect'
                                    });
                                })}
                            </div>
                        )}
                    </div>
                );
            });
        }

        // Then, render TARGET-only tasks (tasks that are only targets, not sources)
        const targetOnlyTasks = uniquePlaygroundPoints.filter(p => {
            const isSource = p.logic?.onOpen?.length > 0 || 
                           p.logic?.onCorrect?.length > 0 || 
                           p.logic?.onIncorrect?.length > 0;
            const isTarget = uniquePlaygroundPoints.some(other =>
                other.id !== p.id && (
                    other.logic?.onOpen?.some((a: any) => (a.targetId || a) === p.id) ||
                    other.logic?.onCorrect?.some((a: any) => (a.targetId || a) === p.id) ||
                    other.logic?.onIncorrect?.some((a: any) => (a.targetId || a) === p.id)
                )
            );
            return isTarget && !isSource;
        });

        if (targetOnlyTasks.length > 0) {
            renderedItems.push(
                <div key="header-target" className="flex items-center gap-2 py-2 px-2 mt-3 mb-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        🎯 TARGET Tasks
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 via-transparent to-transparent" />
                </div>
            );

            targetOnlyTasks.forEach(task => {
                renderedItems.push(renderTaskItem(task));
            });
        }

        // Finally, render tasks with no actions
        const noActionTasks = uniquePlaygroundPoints.filter(p => {
            const isSource = p.logic?.onOpen?.length > 0 || 
                           p.logic?.onCorrect?.length > 0 || 
                           p.logic?.onIncorrect?.length > 0;
            const isTarget = uniquePlaygroundPoints.some(other =>
                other.id !== p.id && (
                    other.logic?.onOpen?.some((a: any) => (a.targetId || a) === p.id) ||
                    other.logic?.onCorrect?.some((a: any) => (a.targetId || a) === p.id) ||
                    other.logic?.onIncorrect?.some((a: any) => (a.targetId || a) === p.id)
                )
            );
            return !isSource && !isTarget;
        });

        if (noActionTasks.length > 0) {
            renderedItems.push(
                <div key="header-noaction" className="flex items-center gap-2 py-2 px-2 mt-3 mb-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        📋 No Actions
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-600 via-transparent to-transparent" />
                </div>
            );

            noActionTasks.forEach(task => {
                renderedItems.push(renderTaskItem(task));
            });
        }

        return renderedItems;
    }
};
