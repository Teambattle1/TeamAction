
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GamePoint, IconId, TaskType, PointActivationType, PointCompletionLogic } from '../types';
import { ICON_COMPONENTS } from '../utils/icons';
import { getCroppedImg } from '../utils/image';
import Cropper from 'react-easy-crop';
import { generateAiImage } from '../services/ai';
import QRCode from 'qrcode';
import { 
  X, Save, Trash2, Upload, Link, Loader2, CheckCircle, 
  AlignLeft, CheckSquare, ListChecks, ToggleLeft, SlidersHorizontal, 
  Plus, AlertCircle, ZoomIn, Scissors, Image as ImageIcon, Tag, 
  Copy, KeyRound, ChevronDown, ChevronsUpDown, RotateCw, Type, 
  Palette, Bold, Italic, Underline, MonitorPlay, Speaker, MapPin, 
  Settings, Zap, MessageSquare, Clock, Globe, Lock, Check, Wand2, Hash,
  Edit2, MousePointerClick, EyeOff, Eye, Maximize, Smartphone, Monitor, QrCode, Download, Map as MapIcon, Info
} from 'lucide-react';

interface TaskEditorProps {
  point: GamePoint;
  onSave: (point: GamePoint) => void;
  onDelete: (pointId: string) => void;
  onClose: () => void;
  onClone?: (point: GamePoint) => void;
  isTemplateMode?: boolean; 
}

const TAG_COLORS = ['#64748b', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
const AREA_COLORS = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Gray', value: '#64748b' },
    { name: 'Yellow', value: '#eab308' },
];
const LANGUAGES = ['English', 'Danish (Dansk)', 'German (Deutsch)', 'Spanish (Español)', 'French (Français)'];

// --- RICH TEXT EDITOR COMPONENT ---
const RichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const handleCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val || '');
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 transition-shadow bg-white dark:bg-gray-700">
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
        <button type="button" onClick={() => handleCommand('bold')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => handleCommand('italic')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => handleCommand('underline')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button type="button" onClick={() => handleCommand('foreColor', '#ef4444')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-red-500 font-bold">A</button>
        <button type="button" onClick={() => handleCommand('foreColor', '#3b82f6')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-blue-500 font-bold">A</button>
      </div>
      <div 
        className="p-3 min-h-[100px] outline-none text-sm text-gray-900 dark:text-white prose dark:prose-invert max-w-none"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
};

const TaskEditor: React.FC<TaskEditorProps> = ({ point, onSave, onDelete, onClose, onClone, isTemplateMode = false }) => {
  const [editedPoint, setEditedPoint] = useState<GamePoint>({ 
    ...point,
    points: point.points || 100,
    shortIntro: point.shortIntro || '',
    activationTypes: point.activationTypes || ['radius'],
    areaColor: point.areaColor || '',
    iconUrl: point.iconUrl || '',
    completionLogic: point.completionLogic || 'remove_any',
    instructorNotes: point.instructorNotes || '',
    isHiddenBeforeScan: point.isHiddenBeforeScan || false,
    task: {
        type: 'text',
        options: [],
        correctAnswers: [],
        range: { min: 0, max: 100, step: 1, correctValue: 50, tolerance: 0 },
        placeholder: '',
        ...point.task
    },
    feedback: {
        correctMessage: 'Correct!',
        showCorrectMessage: true,
        incorrectMessage: 'Incorrect, try again.',
        showIncorrectMessage: true,
        hint: '',
        hintCost: 10,
        ...point.feedback
    },
    settings: {
        timeLimitSeconds: undefined,
        scoreDependsOnSpeed: false,
        language: 'Danish (Dansk)',
        showAnswerStatus: true,
        showCorrectAnswerOnMiss: false,
        ...point.settings
    },
    tags: point.tags || []
  });

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'IMAGE' | 'SETTINGS' | 'ACTIONS'>('GENERAL');
  const [tagInput, setTagInput] = useState('');
  
  // Image states
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinIconInputRef = useRef<HTMLInputElement>(null);

  // QR Code State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Generate QR Code when relevant fields change or tab opens
  useEffect(() => {
      if (activeTab === 'ACTIONS' && (editedPoint.activationTypes.includes('qr') || editedPoint.activationTypes.includes('click') || editedPoint.isHiddenBeforeScan)) {
          // Payload: Use ID as unique identifier for unlocking
          const payload = JSON.stringify({ id: editedPoint.id, action: 'unlock' });
          QRCode.toDataURL(payload, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
              .then(url => setQrCodeDataUrl(url))
              .catch(err => console.error(err));
      }
  }, [activeTab, editedPoint.activationTypes, editedPoint.id, editedPoint.isHiddenBeforeScan]);

  const handleGenerateImage = async () => {
      const prompt = editedPoint.task.question.replace(/<[^>]*>?/gm, '') + " " + editedPoint.title;
      if (!prompt.trim()) return;
      setIsGeneratingImage(true);
      const img = await generateAiImage(prompt);
      if (img) setEditedPoint(prev => ({ ...prev, task: { ...prev.task, imageUrl: img } }));
      setIsGeneratingImage(false);
  };

  const handlePinIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditedPoint(prev => ({ ...prev, iconUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedPoint);
  };

  const renderTypeConfig = () => {
    const { type, options, answer } = editedPoint.task;
    const correctAnswers = editedPoint.task.correctAnswers || [];
    
    const addOption = () => setEditedPoint(prev => ({...prev, task: {...prev.task, options: [...(prev.task.options||[]), `Option ${(prev.task.options?.length||0)+1}`]}}));
    
    const updateOption = (i: number, val: string) => {
        const newOpts = [...(options||[])]; 
        const oldVal = newOpts[i];
        newOpts[i] = val;
        
        let newCorrectAnswers = correctAnswers;
        if (correctAnswers.includes(oldVal)) {
            newCorrectAnswers = correctAnswers.map(c => c === oldVal ? val : c);
        }
        let newAnswer = answer;
        if (answer === oldVal) {
            newAnswer = val;
        }

        setEditedPoint({...editedPoint, task: {...editedPoint.task, options: newOpts, correctAnswers: newCorrectAnswers, answer: newAnswer }});
    };

    const removeOption = (i: number) => {
        const optToRemove = options?.[i];
        const newOpts = [...(options||[])]; newOpts.splice(i, 1);
        
        let newCorrectAnswers = correctAnswers;
        if (optToRemove && correctAnswers.includes(optToRemove)) {
            newCorrectAnswers = correctAnswers.filter(c => c !== optToRemove);
        }
        
        let newAnswer = answer;
        if (answer === optToRemove) newAnswer = undefined;

        setEditedPoint({...editedPoint, task: {...editedPoint.task, options: newOpts, correctAnswers: newCorrectAnswers, answer: newAnswer }});
    };

    const toggleCorrectOption = (opt: string) => {
        const isMulti = type === 'checkbox' || type === 'multi_select_dropdown';
        if (isMulti) {
            const current = correctAnswers;
            const newAnswers = current.includes(opt) 
                ? current.filter(a => a !== opt)
                : [...current, opt];
            setEditedPoint({
                ...editedPoint, 
                task: { ...editedPoint.task, correctAnswers: newAnswers }
            });
        } else {
            // Single choice types
            setEditedPoint({
                ...editedPoint, 
                task: { ...editedPoint.task, answer: opt }
            });
        }
    };

    if (type === 'text') {
        return (
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">CORRECT ANSWER</label>
                <input type="text" value={editedPoint.task.answer || ''} onChange={(e) => setEditedPoint({...editedPoint, task: {...editedPoint.task, answer: e.target.value}})} className="w-full p-2 border rounded bg-white dark:bg-gray-700"/>
            </div>
        );
    }
    
    if (['multiple_choice', 'checkbox', 'dropdown', 'multi_select_dropdown'].includes(type)) {
        const isMulti = type === 'checkbox' || type === 'multi_select_dropdown';
        return (
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">OPTIONS & ANSWERS</label>
                {options?.map((opt, idx) => {
                    const isCorrect = isMulti 
                        ? correctAnswers.includes(opt) 
                        : answer === opt;

                    return (
                        <div key={idx} className="flex gap-2 items-center group">
                            <button 
                                type="button"
                                onClick={() => toggleCorrectOption(opt)}
                                className={`p-2 rounded border transition-colors ${isCorrect ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-400'}`}
                                title={isCorrect ? "Correct Answer" : "Mark as Correct"}
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => updateOption(idx, e.target.value)} 
                                className={`flex-1 p-2 border rounded bg-white dark:bg-gray-700 text-sm ${isCorrect ? 'border-green-500 ring-1 ring-green-500/20' : ''}`}
                            />
                            <button type="button" onClick={() => removeOption(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded opacity-50 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    );
                })}
                <button type="button" onClick={addOption} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline mt-2"><Plus className="w-3 h-3" /> ADD OPTION</button>
            </div>
        );
    }
    return <p className="text-xs text-gray-500 uppercase italic">No specific settings needed for this type.</p>;
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-gray-800 sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] relative">
        
        {/* Header */}
        <div className={`p-4 text-white flex justify-between items-center flex-shrink-0 ${isTemplateMode ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg"><Edit2 className="w-5 h-5" /></div>
              <h2 className="text-lg font-black uppercase tracking-widest">
                  {isCropping ? 'CROP IMAGE' : 'TASK EDITOR'}
              </h2>
          </div>
          {!isCropping && <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>}
        </div>

        {isCropping && pendingImage ? (
           <div className="flex flex-col h-full bg-black p-4">
              <div className="relative flex-1 rounded-xl overflow-hidden mb-4 border border-gray-700">
                  <Cropper 
                    image={pendingImage} 
                    crop={crop} 
                    zoom={zoom} 
                    rotation={rotation} 
                    aspect={aspect} 
                    onCropChange={setCrop} 
                    onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} 
                    onZoomChange={setZoom} 
                    onRotationChange={setRotation} 
                    onMediaLoaded={(mediaSize) => {
                        setZoom(1);
                    }}
                  />
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button type="button" onClick={() => setRotation((r) => r + 90)} className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white"><RotateCw className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-3">
                  <button type="button" onClick={() => { setIsCropping(false); setPendingImage(null); }} className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-bold uppercase tracking-wide">CANCEL</button>
                  <button type="button" onClick={async () => {
                      setIsUploading(true);
                      try {
                          if (!pendingImage) throw new Error("No image to crop");
                          const img = await getCroppedImg(pendingImage, croppedAreaPixels, rotation);
                          setEditedPoint({...editedPoint, task: {...editedPoint.task, imageUrl: img}});
                          setIsCropping(false); 
                          setPendingImage(null);
                      } catch(e: any) { 
                          console.error(e);
                      }
                      setIsUploading(false);
                  }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wide">{isUploading ? 'SAVING...' : 'CROP & SAVE'}</button>
              </div>
           </div>
        ) : (
           <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
               
               {/* TABS */}
               <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
                   {[
                       {id: 'GENERAL', label: 'General', icon: AlignLeft},
                       {id: 'IMAGE', label: 'Image', icon: ImageIcon},
                       {id: 'SETTINGS', label: 'Config', icon: SlidersHorizontal},
                       {id: 'ACTIONS', label: 'Actions', icon: Zap},
                   ].map(tab => (
                       <button
                           key={tab.id}
                           type="button"
                           onClick={() => setActiveTab(tab.id as any)}
                           className={`flex-1 py-3 text-[10px] font-black uppercase flex flex-col items-center gap-1 border-b-2 transition-all ${activeTab === tab.id ? 'border-orange-600 text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                       >
                           <tab.icon className="w-4 h-4" />
                           {tab.label}
                       </button>
                   ))}
               </div>

               {/* SCROLLABLE CONTENT */}
               <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-gray-900 custom-scrollbar">
                   
                   {activeTab === 'GENERAL' && (
                       <div className="space-y-6">
                           <div>
                               <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em]">Title</label>
                               <input type="text" value={editedPoint.title} onChange={(e) => setEditedPoint({ ...editedPoint, title: e.target.value })} className="w-full px-4 py-2 border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:border-orange-500 outline-none transition-all" placeholder="e.g. Statue Quiz"/>
                           </div>
                           <div>
                               <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em]">TASK DESCRIPTION</label>
                               <RichTextEditor value={editedPoint.task.question} onChange={(html) => setEditedPoint({ ...editedPoint, task: { ...editedPoint.task, question: html } })} />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em]">TYPE</label>
                                   <div className="relative">
                                       <select value={editedPoint.task.type} onChange={(e) => setEditedPoint({ ...editedPoint, task: { ...editedPoint.task, type: e.target.value as any } })} className="w-full px-4 py-2.5 border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:border-orange-500 outline-none appearance-none cursor-pointer">
                                           <option value="text">TEXT INPUT</option>
                                           <option value="multiple_choice">QUIZ (MC)</option>
                                           <option value="boolean">YES / NO</option>
                                           <option value="slider">SLIDER</option>
                                           <option value="checkbox">CHECKBOXES</option>
                                           <option value="dropdown">DROPDOWN</option>
                                       </select>
                                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em]">POINTS</label>
                                   <input type="number" value={editedPoint.points} onChange={(e) => setEditedPoint({ ...editedPoint, points: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:border-orange-500 outline-none transition-all"/>
                               </div>
                           </div>
                           <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                               {renderTypeConfig()}
                           </div>
                       </div>
                   )}

                   {activeTab === 'IMAGE' && (
                       <div className="space-y-6">
                           <div>
                               <div className="flex justify-between items-center mb-3">
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">COVER IMAGE</label>
                                   <div className="flex gap-2">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-orange-500 hover:text-white transition-all uppercase tracking-wide flex items-center gap-1"><Upload className="w-3 h-3" /> UPLOAD</button>
                                        <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImage} className="text-[10px] font-black px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all uppercase tracking-wide flex items-center gap-1 shadow-md disabled:opacity-50">{isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI GEN</button>
                                   </div>
                               </div>
                               <div className="w-full rounded-2xl border-4 border-dashed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex items-center justify-center relative overflow-hidden group min-h-[200px]">
                                   {editedPoint.task.imageUrl ? (
                                       <>
                                           <img src={editedPoint.task.imageUrl} className="max-w-full max-h-[400px] object-contain" alt="Task Cover" />
                                           <div className="absolute top-4 right-4 flex gap-2">
                                              <button type="button" onClick={() => { setPendingImage(editedPoint.task.imageUrl || null); setIsCropping(true); }} className="p-2 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Scissors className="w-4 h-4"/></button>
                                              <button type="button" onClick={() => setEditedPoint({...editedPoint, task: {...editedPoint.task, imageUrl: undefined}})} className="p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 className="w-4 h-4"/></button>
                                           </div>
                                       </>
                                   ) : (
                                       <div className="text-center opacity-30 group-hover:opacity-50 transition-opacity p-8">
                                           <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                           <p className="text-[10px] font-black uppercase">Click upload or AI Gen to add image</p>
                                       </div>
                                   )}
                                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if(file) {
                                           const reader = new FileReader();
                                           reader.onloadend = () => { setPendingImage(reader.result as string); setIsCropping(true); };
                                           reader.readAsDataURL(file);
                                       }
                                   }} />
                               </div>
                           </div>
                       </div>
                   )}

                   {activeTab === 'SETTINGS' && (
                       <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                           
                           {/* TIME & LANGUAGE */}
                           <div className="space-y-4">
                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em] flex items-center gap-1">
                                       Time limit <span className="text-gray-300 italic normal-case">- optional</span> <Info className="w-3 h-3" />
                                   </label>
                                   <div className="flex">
                                       <input 
                                            type="number" 
                                            placeholder="Set time limit in seconds"
                                            value={editedPoint.settings?.timeLimitSeconds || ''}
                                            onChange={(e) => setEditedPoint({...editedPoint, settings: {...editedPoint.settings, timeLimitSeconds: parseInt(e.target.value) || undefined }})}
                                            className="w-full px-4 py-3 border-2 border-r-0 dark:border-gray-700 rounded-l-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all"
                                       />
                                       <span className="bg-gray-100 dark:bg-gray-700 border-2 dark:border-gray-700 border-l-0 rounded-r-xl px-4 flex items-center text-sm font-bold text-gray-500 uppercase">seconds</span>
                                   </div>
                               </div>

                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em]">Language</label>
                                   <div className="relative">
                                       <select 
                                            value={editedPoint.settings?.language || 'English'}
                                            onChange={(e) => setEditedPoint({...editedPoint, settings: {...editedPoint.settings, language: e.target.value}})}
                                            className="w-full px-4 py-3 border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none appearance-none"
                                       >
                                           {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                       </select>
                                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                   </div>
                               </div>
                           </div>

                           {/* PIN & AREA CUSTOMIZATION */}
                           <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                               
                               {/* Pin Icon Selector */}
                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em] flex items-center gap-1">Pin icon <Info className="w-3 h-3" /></label>
                                   <div className="grid grid-cols-2 gap-3">
                                       {/* Existing Icons */}
                                       <div className="relative">
                                           <select 
                                                value={editedPoint.iconId}
                                                onChange={(e) => setEditedPoint({...editedPoint, iconId: e.target.value as IconId, iconUrl: undefined })}
                                                className="w-full pl-10 pr-4 py-3 border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none appearance-none"
                                           >
                                               {Object.keys(ICON_COMPONENTS).map(k => (
                                                   <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} Pin</option>
                                               ))}
                                           </select>
                                           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500">
                                               {React.createElement(ICON_COMPONENTS[editedPoint.iconId], { className: "w-5 h-5" })}
                                           </div>
                                           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                       </div>

                                       {/* Custom Upload */}
                                       <button 
                                            type="button" 
                                            onClick={() => pinIconInputRef.current?.click()}
                                            className="w-full py-3 bg-[#00adef] hover:bg-[#0096ce] text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition-all"
                                       >
                                           {editedPoint.iconUrl ? <ImageIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                           {editedPoint.iconUrl ? "Change Custom Pin" : "New custom pin"}
                                       </button>
                                       <input ref={pinIconInputRef} type="file" accept="image/*" className="hidden" onChange={handlePinIconUpload} />
                                   </div>
                                   {editedPoint.iconUrl && (
                                       <div className="mt-2 flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                           <img src={editedPoint.iconUrl} className="w-8 h-8 object-cover rounded-full border border-gray-300" alt="Custom Pin" />
                                           <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Custom Pin Active</span>
                                           <button onClick={() => setEditedPoint({...editedPoint, iconUrl: undefined})} className="ml-auto text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                   )}
                               </div>

                               {/* Area Color */}
                               <div>
                                   <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em] flex items-center gap-1">Area color <Info className="w-3 h-3" /></label>
                                   <div className="flex flex-wrap gap-2 mb-2">
                                       {AREA_COLORS.map(c => (
                                           <button
                                                key={c.name}
                                                type="button"
                                                onClick={() => setEditedPoint({...editedPoint, areaColor: c.value})}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${editedPoint.areaColor === c.value ? 'scale-110 shadow-lg border-black dark:border-white' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                           />
                                       ))}
                                   </div>
                                   <div className="relative">
                                       <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: editedPoint.areaColor || '#10b981' }} />
                                       <input 
                                            type="text" 
                                            placeholder="Select color or enter hex..."
                                            value={editedPoint.areaColor || ''}
                                            onChange={(e) => setEditedPoint({...editedPoint, areaColor: e.target.value})}
                                            className="w-full pl-10 pr-10 py-3 border-2 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all uppercase"
                                       />
                                       {editedPoint.areaColor && (
                                           <button onClick={() => setEditedPoint({...editedPoint, areaColor: undefined})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                                               <X className="w-4 h-4" />
                                           </button>
                                       )}
                                   </div>
                               </div>
                           </div>

                           {/* INSTRUCTOR NOTES */}
                           <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                               <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-[0.2em] flex items-center gap-1">Instructor notes <span className="text-gray-300 italic normal-case">- optional</span> <Info className="w-3 h-3" /></label>
                               <textarea 
                                    value={editedPoint.instructorNotes || ''}
                                    onChange={(e) => setEditedPoint({...editedPoint, instructorNotes: e.target.value})}
                                    placeholder="Extra info for the instructor"
                                    className="w-full p-3 rounded-xl border-2 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all resize-none h-24 text-sm"
                               />
                           </div>

                           {/* LOGIC & BEHAVIOR CHECKBOXES */}
                           <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                               <label className="flex items-center gap-3 cursor-pointer group">
                                   <input 
                                        type="radio" 
                                        name="completionLogic"
                                        checked={editedPoint.completionLogic === 'remove_any'}
                                        onChange={() => setEditedPoint({...editedPoint, completionLogic: 'remove_any'})}
                                        className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300"
                                   />
                                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remove when answered correctly/incorrectly</span>
                                   <Info className="w-4 h-4 text-gray-400 ml-auto" />
                               </label>

                               <label className="flex items-center gap-3 cursor-pointer group">
                                   <input 
                                        type="radio" 
                                        name="completionLogic"
                                        checked={editedPoint.completionLogic === 'keep_until_correct'}
                                        onChange={() => setEditedPoint({...editedPoint, completionLogic: 'keep_until_correct'})}
                                        className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300"
                                   />
                                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keep until answered correctly</span>
                                   <Info className="w-4 h-4 text-gray-400 ml-auto" />
                               </label>

                               <label className="flex items-center gap-3 cursor-pointer group">
                                   <input 
                                        type="radio" 
                                        name="completionLogic"
                                        checked={editedPoint.completionLogic === 'keep_always'}
                                        onChange={() => setEditedPoint({...editedPoint, completionLogic: 'keep_always'})}
                                        className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300"
                                   />
                                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keep until the end of the game</span>
                                   <Info className="w-4 h-4 text-gray-400 ml-auto" />
                               </label>

                               <label className="flex items-center gap-3 cursor-pointer group mt-4">
                                   <input 
                                        type="checkbox" 
                                        checked={editedPoint.completionLogic === 'allow_close'}
                                        onChange={(e) => setEditedPoint({...editedPoint, completionLogic: e.target.checked ? 'allow_close' : 'remove_any'})} // Simplified mapping for demo
                                        className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                                   />
                                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow to close without answering and return later</span>
                                   <Info className="w-4 h-4 text-gray-400 ml-auto" />
                               </label>

                               <label className="flex items-center gap-3 cursor-pointer group">
                                   <input 
                                        type="checkbox" 
                                        checked={editedPoint.settings?.showAnswerStatus}
                                        onChange={(e) => setEditedPoint({...editedPoint, settings: {...editedPoint.settings, showAnswerStatus: e.target.checked}})}
                                        className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                                   />
                                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show if the answer was correct or incorrect</span>
                                   <Info className="w-4 h-4 text-gray-400 ml-auto" />
                               </label>

                               <label className="flex items-center gap-3 cursor-pointer group">
                                   <input 
                                        type="checkbox" 
                                        checked={editedPoint.settings?.showCorrectAnswerOnMiss}
                                        onChange={(e) => setEditedPoint({...editedPoint, settings: {...editedPoint.settings, showCorrectAnswerOnMiss: e.target.checked}})}
                                        className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                                   />
                                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show correct answer after user answers incorrectly</span>
                                   <Info className="w-4 h-4 text-gray-400 ml-auto" />
                               </label>
                           </div>
                       </div>
                   )}

                   {activeTab === 'ACTIONS' && (
                       <div className="space-y-6">
                           <div className="space-y-3">
                               <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">UNLOCK METHODS</label>
                               {[
                                   { id: 'radius', label: 'GPS GEOFENCE', desc: 'Unlocks within physical radius', icon: MapIcon },
                                   { id: 'click', label: 'TAP TO OPEN', desc: 'Allows opening from anywhere', icon: MousePointerClick },
                                   { id: 'qr', label: 'QR / BARCODE', desc: 'Player must scan a code', icon: Hash },
                               ].map(method => (
                                   <button
                                       key={method.id}
                                       type="button"
                                       onClick={() => {
                                           const exists = editedPoint.activationTypes.includes(method.id as any);
                                           const newTypes = exists ? editedPoint.activationTypes.filter(t => t !== method.id) : [...editedPoint.activationTypes, method.id as any];
                                           setEditedPoint({...editedPoint, activationTypes: newTypes});
                                       }}
                                       className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${editedPoint.activationTypes.includes(method.id as any) ? 'bg-orange-50 border-orange-500 dark:bg-orange-900/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-200'}`}
                                   >
                                       <div className={`p-3 rounded-xl ${editedPoint.activationTypes.includes(method.id as any) ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}><method.icon className="w-6 h-6" /></div>
                                       <div className="flex-1 min-w-0">
                                           <span className="block font-black text-sm uppercase tracking-wide">{method.label}</span>
                                           <span className="text-[10px] text-gray-500 uppercase font-bold">{method.desc}</span>
                                       </div>
                                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${editedPoint.activationTypes.includes(method.id as any) ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-200'}`}>{editedPoint.activationTypes.includes(method.id as any) && <Check className="w-4 h-4" />}</div>
                                   </button>
                               ))}
                           </div>

                           {/* QR Code Display */}
                           {(editedPoint.activationTypes.includes('qr') || editedPoint.isHiddenBeforeScan) && qrCodeDataUrl && (
                               <div className="bg-white dark:bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center animate-in fade-in">
                                   <div className="w-48 h-48 mb-4">
                                       <img src={qrCodeDataUrl} alt="Task QR Code" className="w-full h-full" />
                                   </div>
                                   <p className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4">SCAN TO UNLOCK THIS TASK</p>
                                   <a 
                                       href={qrCodeDataUrl} 
                                       download={`qrcode-${editedPoint.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`}
                                       className="px-6 py-2.5 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-colors"
                                   >
                                       <Download className="w-4 h-4" /> DOWNLOAD QR
                                   </a>
                               </div>
                           )}

                           <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                               <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">VISIBILITY SETTINGS</label>
                               <button
                                   type="button"
                                   onClick={() => setEditedPoint({...editedPoint, isHiddenBeforeScan: !editedPoint.isHiddenBeforeScan})}
                                   className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${editedPoint.isHiddenBeforeScan ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-purple-200'}`}
                               >
                                   <div className={`p-3 rounded-xl ${editedPoint.isHiddenBeforeScan ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                       {editedPoint.isHiddenBeforeScan ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <span className="block font-black text-sm uppercase tracking-wide">HIDDEN UNTIL SCAN</span>
                                       <span className="text-[10px] text-gray-500 uppercase font-bold">Task is invisible to team until scanned or logic-unlocked</span>
                                   </div>
                                   <div className={`w-12 h-6 rounded-full relative transition-colors ${editedPoint.isHiddenBeforeScan ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editedPoint.isHiddenBeforeScan ? 'left-7' : 'left-1'}`} />
                                   </div>
                               </button>
                           </div>

                           {editedPoint.activationTypes.includes('radius') && (
                               <div className="p-5 bg-gray-50 dark:bg-gray-850 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
                                   <div className="flex justify-between items-center mb-4">
                                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GEOFENCE RADIUS</label>
                                       <span className="text-xl font-black text-orange-600">{editedPoint.radiusMeters}m</span>
                                   </div>
                                   <input type="range" min="10" max="500" step="5" value={editedPoint.radiusMeters} onChange={(e) => setEditedPoint({...editedPoint, radiusMeters: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-600"/>
                               </div>
                           )}
                       </div>
                   )}
               </div>

               {/* FOOTER */}
               <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3 flex-shrink-0">
                    <button type="button" onClick={() => onDelete(point.id)} className="p-3 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-2xl hover:bg-red-200 transition-colors"><Trash2 className="w-6 h-6"/></button>
                    {onClone && <button type="button" onClick={() => onClone(editedPoint)} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-300 transition-all flex items-center justify-center gap-2">CLONE</button>}
                    <button type="submit" className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2">SAVE CHANGES</button>
               </div>
           </form>
        )}
      </div>
    </div>
  );
};

export default TaskEditor;
