import React, { useState } from 'react';
import { TaskColorScheme, TaskType } from '../types';
import { X, RefreshCw, Palette, Eye, Check } from 'lucide-react';

interface ColorSchemeEditorProps {
  initialScheme?: TaskColorScheme;
  onSave: (scheme: TaskColorScheme) => void;
  onClose: () => void;
  title?: string;
}

// Default color scheme
const DEFAULT_SCHEME: TaskColorScheme = {
  backgroundColor: '#0a0f1d',
  headerColor: '#1e293b',
  questionColor: '#ffffff',
  optionBackgroundColor: '#334155',
  optionTextColor: '#ffffff',
  correctColor: '#10b981',
  incorrectColor: '#ef4444',
  buttonColor: '#3b82f6',
  buttonTextColor: '#ffffff',
  borderColor: '#475569',
};

const ColorSchemeEditor: React.FC<ColorSchemeEditorProps> = ({
  initialScheme = DEFAULT_SCHEME,
  onSave,
  onClose,
  title = 'Edit Task Color Scheme'
}) => {
  const [scheme, setScheme] = useState<TaskColorScheme>({ ...DEFAULT_SCHEME, ...initialScheme });
  const [previewType, setPreviewType] = useState<TaskType>('multiple_choice');
  const [showAnswers, setShowAnswers] = useState(false);
  const [showCorrect, setShowCorrect] = useState(true);

  const updateColor = (key: keyof TaskColorScheme, value: string) => {
    setScheme(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefault = () => {
    setScheme({ ...DEFAULT_SCHEME });
  };

  const handleSave = () => {
    onSave(scheme);
  };

  // Color input sections
  const colorControls = [
    { key: 'backgroundColor' as const, label: 'Background', description: 'Main task background' },
    { key: 'headerColor' as const, label: 'Header', description: 'Title area background' },
    { key: 'questionColor' as const, label: 'Question Text', description: 'Question text color' },
    { key: 'optionBackgroundColor' as const, label: 'Option Background', description: 'Answer options background' },
    { key: 'optionTextColor' as const, label: 'Option Text', description: 'Answer text color' },
    { key: 'correctColor' as const, label: 'Correct Answer', description: 'Correct highlight color' },
    { key: 'incorrectColor' as const, label: 'Incorrect Answer', description: 'Wrong highlight color' },
    { key: 'buttonColor' as const, label: 'Button', description: 'Action buttons' },
    { key: 'buttonTextColor' as const, label: 'Button Text', description: 'Button text color' },
    { key: 'borderColor' as const, label: 'Borders', description: 'Borders and dividers' },
  ];

  return (
    <div className="fixed inset-0 z-[7000] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase">{title}</h2>
              <p className="text-xs text-slate-400">Customize task appearance with live preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Color Controls */}
          <div className="w-96 border-r border-slate-700 bg-slate-800/50 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-white uppercase">Color Settings</h3>
                <button
                  onClick={resetToDefault}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-xs font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {colorControls.map((control) => (
                <div key={control.key} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    {control.label}
                  </label>
                  <p className="text-[10px] text-slate-500">{control.description}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={scheme[control.key]}
                      onChange={(e) => updateColor(control.key, e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-600 bg-slate-700"
                    />
                    <input
                      type="text"
                      value={scheme[control.key]}
                      onChange={(e) => updateColor(control.key, e.target.value)}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Preview Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-black text-white uppercase">Live Preview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={previewType}
                    onChange={(e) => setPreviewType(e.target.value as TaskType)}
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-bold"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="text">Text Input</option>
                    <option value="boolean">True/False</option>
                    <option value="checkbox">Checkboxes</option>
                  </select>
                  <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      showAnswers
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {showAnswers ? 'Show Answers' : 'Hide Answers'}
                  </button>
                  {showAnswers && (
                    <button
                      onClick={() => setShowCorrect(!showCorrect)}
                      className="px-3 py-2 bg-slate-700 rounded-lg text-xs font-bold text-white"
                    >
                      {showCorrect ? 'Correct' : 'Wrong'}
                    </button>
                  )}
                </div>
              </div>

              {/* Task Preview Card */}
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  backgroundColor: scheme.backgroundColor,
                  borderColor: scheme.borderColor,
                  borderWidth: '2px',
                }}
              >
                {/* Header */}
                <div
                  className="p-6"
                  style={{
                    backgroundColor: scheme.headerColor,
                    borderBottomColor: scheme.borderColor,
                    borderBottomWidth: '2px',
                  }}
                >
                  <h3 className="text-xl font-black uppercase" style={{ color: scheme.questionColor }}>
                    Sample Task Title
                  </h3>
                  <p className="text-sm opacity-70 mt-2" style={{ color: scheme.questionColor }}>
                    This is how your task will appear to players
                  </p>
                </div>

                {/* Question */}
                <div className="p-6">
                  <p className="text-lg font-bold mb-6" style={{ color: scheme.questionColor }}>
                    {previewType === 'boolean'
                      ? 'Is this statement true or false?'
                      : previewType === 'text'
                      ? 'Enter your answer below:'
                      : 'Select the correct answer:'}
                  </p>

                  {/* Options Preview */}
                  <div className="space-y-3">
                    {previewType === 'multiple_choice' && (
                      <>
                        {['Option A', 'Option B', 'Option C', 'Option D'].map((option, idx) => {
                          const isCorrectAnswer = idx === 1;
                          const isSelected = showAnswers && (showCorrect ? isCorrectAnswer : idx === 0);
                          const bgColor = isSelected
                            ? showCorrect
                              ? scheme.correctColor
                              : scheme.incorrectColor
                            : scheme.optionBackgroundColor;

                          return (
                            <div
                              key={option}
                              className="p-4 rounded-xl font-bold transition-all cursor-pointer"
                              style={{
                                backgroundColor: bgColor,
                                color: scheme.optionTextColor,
                                borderColor: scheme.borderColor,
                                borderWidth: '1px',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {isSelected && showAnswers && (
                                  <Check className="w-5 h-5" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {previewType === 'boolean' && (
                      <>
                        {['True', 'False'].map((option, idx) => {
                          const isCorrectAnswer = idx === 0;
                          const isSelected = showAnswers && (showCorrect ? isCorrectAnswer : idx === 1);
                          const bgColor = isSelected
                            ? showCorrect
                              ? scheme.correctColor
                              : scheme.incorrectColor
                            : scheme.optionBackgroundColor;

                          return (
                            <div
                              key={option}
                              className="p-4 rounded-xl font-bold transition-all cursor-pointer"
                              style={{
                                backgroundColor: bgColor,
                                color: scheme.optionTextColor,
                                borderColor: scheme.borderColor,
                                borderWidth: '1px',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {isSelected && showAnswers && (
                                  <Check className="w-5 h-5" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {previewType === 'checkbox' && (
                      <>
                        {['Option A', 'Option B', 'Option C'].map((option, idx) => {
                          const isCorrectAnswer = idx === 0 || idx === 2;
                          const isSelected = showAnswers && isCorrectAnswer;
                          const bgColor = isSelected
                            ? scheme.correctColor
                            : scheme.optionBackgroundColor;

                          return (
                            <div
                              key={option}
                              className="p-4 rounded-xl font-bold transition-all cursor-pointer"
                              style={{
                                backgroundColor: bgColor,
                                color: scheme.optionTextColor,
                                borderColor: scheme.borderColor,
                                borderWidth: '1px',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {isSelected && showAnswers && (
                                  <Check className="w-5 h-5" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {previewType === 'text' && (
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        disabled
                        className="w-full p-4 rounded-xl font-bold"
                        style={{
                          backgroundColor: scheme.optionBackgroundColor,
                          color: scheme.optionTextColor,
                          borderColor: scheme.borderColor,
                          borderWidth: '1px',
                        }}
                      />
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    disabled
                    className="w-full mt-6 py-4 rounded-xl font-black text-lg uppercase transition-all shadow-lg"
                    style={{
                      backgroundColor: scheme.buttonColor,
                      color: scheme.buttonTextColor,
                    }}
                  >
                    Submit Answer
                  </button>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
                <p className="text-xs text-blue-300">
                  <strong>💡 Tip:</strong> Changes are applied in real-time. Use the preview controls above to test different task types and answer states.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-black uppercase transition-all shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Apply Color Scheme
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorSchemeEditor;
