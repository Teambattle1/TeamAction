
import React, { useState, useEffect } from 'react';
import { Game, TimerConfig, DesignConfig, GameTaskConfiguration, MapConfiguration, Language, Coordinate } from '../types';
import { X, Save, Clock, Map as MapIcon, LayoutTemplate, Settings, Trash2, Palette, CheckCircle, AlertTriangle, Info, Monitor, Smartphone, Globe } from 'lucide-react';

interface GameCreatorProps {
    onClose: () => void;
    onCreate: (game: Partial<Game>) => Promise<void>;
    baseGame?: Game; // For editing
    onDelete?: (id: string) => void;
}

const LANGUAGES: Language[] = ['English', 'Danish', 'German', 'Spanish', 'French', 'Swedish', 'Norwegian', 'Dutch', 'Belgian', 'Hebrew'];

const GameCreator: React.FC<GameCreatorProps> = ({ onClose, onCreate, baseGame, onDelete }) => {
    // Basic Info
    const [name, setName] = useState(baseGame?.name || '');
    const [description, setDescription] = useState(baseGame?.description || '');
    const [language, setLanguage] = useState<Language>(baseGame?.language || 'English');
    const [finishMessage, setFinishMessage] = useState(baseGame?.finishMessage || '');

    // End Location (Optional)
    const [endLat, setEndLat] = useState(baseGame?.endLocation?.lat?.toString() || '');
    const [endLng, setEndLng] = useState(baseGame?.endLocation?.lng?.toString() || '');

    // Timer Config
    const [timerMode, setTimerMode] = useState<TimerConfig['mode']>(baseGame?.timerConfig?.mode || 'none');
    const [durationMinutes, setDurationMinutes] = useState(baseGame?.timerConfig?.durationMinutes?.toString() || '60');
    const [endTime, setEndTime] = useState(baseGame?.timerConfig?.endTime || '');

    // Design Config
    const [taskBackgroundImage, setTaskBackgroundImage] = useState(baseGame?.designConfig?.taskBackgroundImage || '');
    const [primaryColor, setPrimaryColor] = useState(baseGame?.designConfig?.primaryColor || '#000000');
    const [secondaryColor, setSecondaryColor] = useState(baseGame?.designConfig?.secondaryColor || '#ffffff');
    const [useDefaultPrimary, setUseDefaultPrimary] = useState(!baseGame?.designConfig?.primaryColor);
    const [useDefaultSecondary, setUseDefaultSecondary] = useState(!baseGame?.designConfig?.secondaryColor);
    const [enableCodeScanner, setEnableCodeScanner] = useState(baseGame?.designConfig?.enableCodeScanner ?? true);
    const [enableGameTime, setEnableGameTime] = useState(baseGame?.designConfig?.enableGameTime ?? true);
    const [hideScore, setHideScore] = useState(baseGame?.designConfig?.hideScore ?? false);
    const [showScoreAfter, setShowScoreAfter] = useState(baseGame?.designConfig?.showScoreAfter || '');
    const [hideScoreAfter, setHideScoreAfter] = useState(baseGame?.designConfig?.hideScoreAfter || '');

    // Task Config
    const [timeLimitMode, setTimeLimitMode] = useState<GameTaskConfiguration['timeLimitMode']>(baseGame?.taskConfig?.timeLimitMode || 'none');
    const [globalTimeLimit, setGlobalTimeLimit] = useState(baseGame?.taskConfig?.globalTimeLimit?.toString() || '60');
    const [penaltyMode, setPenaltyMode] = useState<GameTaskConfiguration['penaltyMode']>(baseGame?.taskConfig?.penaltyMode || 'zero');
    const [showCorrectAnswerMode, setShowCorrectAnswerMode] = useState<GameTaskConfiguration['showCorrectAnswerMode']>(baseGame?.taskConfig?.showCorrectAnswerMode || 'always');
    const [limitHints, setLimitHints] = useState(baseGame?.taskConfig?.limitHints ?? false);
    const [hintLimit, setHintLimit] = useState(baseGame?.taskConfig?.hintLimit?.toString() || '3');
    const [showAnswerCorrectnessMode, setShowAnswerCorrectnessMode] = useState<GameTaskConfiguration['showAnswerCorrectnessMode']>(baseGame?.taskConfig?.showAnswerCorrectnessMode || 'always');
    const [showAfterAnswerComment, setShowAfterAnswerComment] = useState(baseGame?.taskConfig?.showAfterAnswerComment ?? true);

    // Map Config
    const [pinDisplayMode, setPinDisplayMode] = useState<MapConfiguration['pinDisplayMode']>(baseGame?.mapConfig?.pinDisplayMode || 'order');
    const [showShortIntroUnderPin, setShowShortIntroUnderPin] = useState(baseGame?.mapConfig?.showShortIntroUnderPin ?? false);
    const [mapInteraction, setMapInteraction] = useState<MapConfiguration['mapInteraction']>(baseGame?.mapConfig?.mapInteraction || 'allow_all');
    const [hideMyLocation, setHideMyLocation] = useState(baseGame?.mapConfig?.hideMyLocation ?? false);
    const [showMyTrack, setShowMyTrack] = useState(baseGame?.mapConfig?.showMyTrack ?? false);
    const [allowNavigation, setAllowNavigation] = useState(baseGame?.mapConfig?.allowNavigation ?? true);
    const [allowWeakGps, setAllowWeakGps] = useState(baseGame?.mapConfig?.allowWeakGps ?? true);

    const [tab, setTab] = useState<'GENERAL' | 'TIME' | 'DESIGN' | 'TASKS' | 'MAP'>('GENERAL');

    const handleSave = async () => {
        let endLocation: Coordinate | undefined = undefined;
        if (endLat && endLng) {
            const lat = parseFloat(endLat);
            const lng = parseFloat(endLng);
            if (!isNaN(lat) && !isNaN(lng)) {
                endLocation = { lat, lng };
            }
        }

        const designConfig: DesignConfig = {
            taskBackgroundImage: taskBackgroundImage || undefined,
            primaryColor: useDefaultPrimary ? undefined : primaryColor,
            secondaryColor: useDefaultSecondary ? undefined : secondaryColor,
            enableCodeScanner,
            enableGameTime,
            hideScore,
            showScoreAfter: showScoreAfter || undefined,
            hideScoreAfter: hideScoreAfter || undefined
        };

        const taskConfig: GameTaskConfiguration = {
            timeLimitMode,
            globalTimeLimit: parseInt(globalTimeLimit) || 0,
            penaltyMode,
            showCorrectAnswerMode,
            limitHints,
            hintLimit: parseInt(hintLimit) || 0,
            showAnswerCorrectnessMode,
            showAfterAnswerComment
        };

        const mapConfig: MapConfiguration = {
            pinDisplayMode,
            showShortIntroUnderPin,
            mapInteraction,
            hideMyLocation,
            showMyTrack,
            allowNavigation,
            allowWeakGps
        };

        const timerConfig: TimerConfig = {
            mode: timerMode,
            durationMinutes: parseInt(durationMinutes) || 0,
            endTime: endTime || undefined
        };

        const newGameData: Partial<Game> = {
            id: baseGame?.id, // Preserve ID if editing
            name,
            description,
            language,
            finishMessage,
            endLocation,
            timerConfig,
            designConfig,
            taskConfig,
            mapConfig
        };

        await onCreate(newGameData);
    };

    return (
       <div className="fixed inset-0 z-[6000] bg-slate-950 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Settings className="w-6 h-6 text-orange-500" /> 
                            {baseGame ? 'GAME SETTINGS' : 'NEW GAME SETUP'}
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
                            {baseGame ? `EDITING: ${baseGame.name}` : 'CONFIGURE NEW MISSION'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
                    {[
                        { id: 'GENERAL', icon: Info, label: 'General' },
                        { id: 'TIME', icon: Clock, label: 'Timing' },
                        { id: 'DESIGN', icon: Palette, label: 'Design' },
                        { id: 'TASKS', icon: LayoutTemplate, label: 'Tasks' },
                        { id: 'MAP', icon: MapIcon, label: 'Map' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-orange-500 text-white bg-slate-900' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                        >
                            <t.icon className="w-4 h-4" /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0f172a]">
                    
                    {/* GENERAL TAB */}
                    {tab === 'GENERAL' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">GAME NAME</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors" placeholder="e.g. City Scavenger Hunt" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">DESCRIPTION / INTRO</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-orange-500 transition-colors h-24 resize-none" placeholder="Brief introduction for players..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">LANGUAGE</label>
                                <select value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 transition-colors">
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">FINISH MESSAGE</label>
                                <textarea value={finishMessage} onChange={e => setFinishMessage(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-orange-500 transition-colors h-24 resize-none" placeholder="Message shown when game ends..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">END LOCATION LAT</label>
                                    <input type="number" value={endLat} onChange={e => setEndLat(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-orange-500" placeholder="Optional" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">END LOCATION LNG</label>
                                    <input type="number" value={endLng} onChange={e => setEndLng(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm outline-none focus:border-orange-500" placeholder="Optional" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TIME TAB */}
                    {tab === 'TIME' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TIMER MODE</label>
                                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                                    {['none', 'countdown', 'countup', 'scheduled_end'].map(m => (
                                        <button key={m} onClick={() => setTimerMode(m as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors ${timerMode === m ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                                            {m.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {timerMode === 'countdown' && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">DURATION (MINUTES)</label>
                                    <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500" />
                                </div>
                            )}
                            {timerMode === 'scheduled_end' && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">END TIME (ISO STRING)</label>
                                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* DESIGN TAB */}
                    {tab === 'DESIGN' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">COLORS</label>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={useDefaultPrimary} onChange={e => setUseDefaultPrimary(e.target.checked)} className="rounded bg-slate-700 border-slate-600" />
                                        <span className="text-xs font-bold text-slate-300 uppercase">USE DEFAULT</span>
                                    </div>
                                    {!useDefaultPrimary && <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-8 w-16 bg-transparent rounded cursor-pointer" />}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Show Code Scanner', val: enableCodeScanner, set: setEnableCodeScanner },
                                    { label: 'Show Game Time', val: enableGameTime, set: setEnableGameTime },
                                    { label: 'Hide Score', val: hideScore, set: setHideScore },
                                ].map((item, idx) => (
                                    <button key={idx} onClick={() => item.set(!item.val)} className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${item.val ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                        <span className="text-xs font-bold uppercase">{item.label}</span>
                                        {item.val ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TASKS CONFIG TAB */}
                    {tab === 'TASKS' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CORRECT ANSWER FEEDBACK</label>
                                <select value={showCorrectAnswerMode} onChange={e => setShowCorrectAnswerMode(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500 uppercase text-xs">
                                    <option value="always">Always Show Correct Answer</option>
                                    <option value="never">Never Show</option>
                                    <option value="task_specific">Task Specific</option>
                                </select>
                            </div>
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300 uppercase">LIMIT HINTS</span>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={limitHints} onChange={e => setLimitHints(e.target.checked)} className="rounded bg-slate-700 border-slate-600 w-4 h-4" />
                                    {limitHints && <input type="number" value={hintLimit} onChange={e => setHintLimit(e.target.value)} className="w-16 bg-slate-800 border border-slate-600 rounded p-1 text-center text-white text-xs font-bold" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAP CONFIG TAB */}
                    {tab === 'MAP' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">PIN DISPLAY MODE</label>
                                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                                    {['order', 'score', 'none'].map(m => (
                                        <button key={m} onClick={() => setPinDisplayMode(m as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors ${pinDisplayMode === m ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Allow Navigation', val: allowNavigation, set: setAllowNavigation },
                                    { label: 'Allow Weak GPS', val: allowWeakGps, set: setAllowWeakGps },
                                    { label: 'Hide My Location', val: hideMyLocation, set: setHideMyLocation },
                                    { label: 'Show My Track', val: showMyTrack, set: setShowMyTrack },
                                ].map((item, idx) => (
                                    <button key={idx} onClick={() => item.set(!item.val)} className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${item.val ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                        <span className="text-xs font-bold uppercase">{item.label}</span>
                                        {item.val ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
                    {baseGame && onDelete ? (
                        <button onClick={() => { if(confirm('Delete game?')) onDelete(baseGame.id); }} className="px-6 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 font-black uppercase text-xs tracking-widest rounded-xl transition-colors border border-red-900/50">
                            DELETE GAME
                        </button>
                    ) : <div></div>}
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black uppercase text-xs tracking-widest rounded-xl transition-colors">
                            CANCEL
                        </button>
                        <button onClick={handleSave} className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-colors shadow-lg shadow-orange-900/20 flex items-center gap-2">
                            <Save className="w-4 h-4" /> SAVE GAME
                        </button>
                    </div>
                </div>
            </div>
       </div>
    );
};

export default GameCreator;
