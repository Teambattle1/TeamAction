import React, { useState, useEffect } from 'react';
import { X, Globe, RefreshCw, CheckCircle, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import {
  fetchTranslationValidationResults,
  triggerTranslationValidation,
  groupResultsByGame,
  countMissingTranslations,
  countByLanguage,
  TranslationValidationResult,
} from '../services/translationValidation';
import { getFlag } from '../utils/i18n';

interface TranslationsManagerProps {
  onClose: () => void;
  onEditTask?: (gameId: string, pointId: string) => void;
}

const TranslationsManager: React.FC<TranslationsManagerProps> = ({ onClose, onEditTask }) => {
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState<TranslationValidationResult[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await fetchTranslationValidationResults();
      setResults(data);
      
      if (data.length > 0) {
        setLastUpdate(data[0].createdAt);
      }
    } catch (error) {
      console.error('[Translations Manager] Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await triggerTranslationValidation();
      
      if (result.success) {
        // Wait a moment for the edge function to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadResults();
      } else {
        alert('Validation failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[Translations Manager] Error triggering validation:', error);
      alert('Failed to run validation. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const toggleGameExpanded = (gameId: string) => {
    setExpandedGames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const groupedResults = groupResultsByGame(results);
  const totalMissing = countMissingTranslations(results);
  const byLanguage = countByLanguage(results);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Translation Manager</h2>
                <p className="text-xs text-slate-400 mt-1">Manage multilingual task translations</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-5 h-5 ${totalMissing > 0 ? 'text-red-400' : 'text-green-400'}`} />
                <span className="text-xs font-bold text-slate-400 uppercase">Missing Translations</span>
              </div>
              <p className={`text-3xl font-black ${totalMissing > 0 ? 'text-red-400' : 'text-green-400'}`}>{totalMissing}</p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Languages Affected</span>
              </div>
              <p className="text-3xl font-black text-blue-400">{Object.keys(byLanguage).length}</p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Last Validation</span>
              </div>
              <p className="text-sm font-bold text-purple-400">
                {lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Language Breakdown */}
          {Object.keys(byLanguage).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase mr-2">Languages:</span>
              {Object.entries(byLanguage).map(([lang, count]) => (
                <span
                  key={lang}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-2"
                >
                  <span>{getFlag(lang)}</span>
                  <span className="text-slate-300">{lang}</span>
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px]">{count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Validate Button */}
          <div className="mt-4">
            <button
              onClick={handleValidate}
              disabled={validating}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-xl font-bold uppercase text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {validating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Validation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Run Validation Now
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2 italic">
              💡 This checks all games for missing or unapproved translations
            </p>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
              <p className="text-sm text-slate-400 font-bold uppercase">Loading translations...</p>
            </div>
          ) : totalMissing === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
              <p className="text-lg font-black text-white uppercase mb-2">All Translations Approved!</p>
              <p className="text-sm text-slate-400">No missing or unapproved translations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([gameId, gameResults]) => {
                const gameName = gameResults[0]?.gameName || 'Unknown Game';
                const isExpanded = expandedGames.has(gameId);

                return (
                  <div key={gameId} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    {/* Game Header */}
                    <button
                      onClick={() => toggleGameExpanded(gameId)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <div className="text-left">
                          <p className="font-black text-white text-sm uppercase">{gameName}</p>
                          <p className="text-xs text-slate-400">
                            {gameResults.length} missing translation{gameResults.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">
                          {gameResults.length}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Task List */}
                    {isExpanded && (
                      <div className="border-t border-slate-700 p-4 space-y-3 bg-slate-900/50">
                        {gameResults.map(result => (
                          <div
                            key={`${result.pointId}-${result.language}`}
                            className="bg-slate-800 border border-slate-600 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <p className="font-bold text-white text-sm">{result.pointTitle}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-400">Language:</span>
                                  <span className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs font-bold text-white flex items-center gap-1">
                                    {getFlag(result.language)} {result.language}
                                  </span>
                                </div>
                              </div>
                              {onEditTask && (
                                <button
                                  onClick={() => onEditTask(result.gameId, result.pointId)}
                                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Edit Task
                                </button>
                              )}
                            </div>

                            {/* Missing Fields */}
                            {result.missingFields.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Missing Fields:</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.missingFields.map(field => (
                                    <span
                                      key={field}
                                      className="bg-red-900/30 border border-red-600/50 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                    >
                                      {field === 'ALL' ? 'Translation Missing' : field}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add missing ChevronDown icon
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default TranslationsManager;
