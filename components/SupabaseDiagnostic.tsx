import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { testDatabaseConnection } from '../services/db';
import { supabase } from '../lib/supabase';

interface SupabaseDiagnosticProps {
    onClose: () => void;
}

const SupabaseDiagnostic: React.FC<SupabaseDiagnosticProps> = ({ onClose }) => {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; error?: string; latency?: number } | null>(null);
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');

    useEffect(() => {
        // Get current Supabase config
        const url = localStorage.getItem('SUPABASE_URL') || 
                   (import.meta as any).env?.VITE_SUPABASE_URL || 
                   'https://yktaxljydisfjyqhbnja.supabase.co';
        const key = localStorage.getItem('SUPABASE_ANON_KEY') || 
                   (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdGF4bGp5ZGlzZmp5cWhibmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzQ2ODYsImV4cCI6MjA4MTcxMDY4Nn0.XeTW4vHGbEm6C7U94zMLsZiDB80cyvuqYbSRNX8oyQI';
        
        setSupabaseUrl(url);
        setSupabaseKey(key.substring(0, 20) + '...');
        
        // Auto-test on mount
        runTest();
    }, []);

    const runTest = async () => {
        setTesting(true);
        setResult(null);
        
        const testResult = await testDatabaseConnection();
        setResult(testResult);
        setTesting(false);
    };

    const updateSupabaseConfig = () => {
        const newUrl = prompt('Enter your Supabase URL:', supabaseUrl);
        if (newUrl) {
            localStorage.setItem('SUPABASE_URL', newUrl);
            const newKey = prompt('Enter your Supabase Anon Key:');
            if (newKey) {
                localStorage.setItem('SUPABASE_ANON_KEY', newKey);
                alert('✅ Configuration updated! Refreshing page...');
                window.location.reload();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-red-900/30 to-orange-900/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">SUPABASE DIAGNOSTIC</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    
                    {/* Current Configuration */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase mb-3">Current Configuration</h3>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Supabase URL:</span>
                                <span className="text-white">{supabaseUrl}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Anon Key:</span>
                                <span className="text-slate-400">{supabaseKey}</span>
                            </div>
                        </div>
                    </div>

                    {/* Connection Test */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-black text-slate-400 uppercase">Connection Test</h3>
                            <button
                                onClick={runTest}
                                disabled={testing}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                                {testing ? 'TESTING...' : 'TEST CONNECTION'}
                            </button>
                        </div>

                        {result && (
                            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {result.success ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                            <span className="text-sm font-bold text-green-400">CONNECTION SUCCESSFUL</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-5 h-5 text-red-400" />
                                            <span className="text-sm font-bold text-red-400">CONNECTION FAILED</span>
                                        </>
                                    )}
                                </div>
                                {result.latency && (
                                    <p className="text-xs text-slate-400">Latency: {result.latency}ms</p>
                                )}
                                {result.error && (
                                    <p className="text-xs text-red-300 mt-2 font-mono">{result.error}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Issue Detected */}
                    {result && !result.success && (
                        <div className="bg-red-900/20 border border-red-600/50 rounded-xl p-4">
                            <h3 className="text-sm font-black text-red-400 uppercase mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                ISSUE DETECTED
                            </h3>
                            <div className="space-y-2 text-xs text-red-200">
                                <p className="font-bold">Your Supabase project appears to be:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>❌ Deleted or removed</li>
                                    <li>⏸️ Paused (free tier projects pause after inactivity)</li>
                                    <li>🔒 Misconfigured CORS settings</li>
                                    <li>🌐 Temporarily unavailable</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Solutions */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase mb-3">Solutions</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold uppercase text-xs flex items-center justify-center gap-2 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                OPEN SUPABASE DASHBOARD
                            </button>
                            
                            <button
                                onClick={updateSupabaseConfig}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-xs transition-colors"
                            >
                                UPDATE SUPABASE CREDENTIALS
                            </button>

                            <button
                                onClick={() => {
                                    if (confirm('This will clear all local data and use demo mode. Continue?')) {
                                        localStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold uppercase text-xs transition-colors"
                            >
                                RESET TO DEMO MODE
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-900/20 border border-blue-600/50 rounded-xl p-4">
                        <h3 className="text-sm font-black text-blue-400 uppercase mb-2">NEXT STEPS</h3>
                        <ol className="list-decimal list-inside space-y-2 text-xs text-blue-200">
                            <li>Check if your Supabase project exists in the dashboard</li>
                            <li>If paused, click "Resume Project" in Supabase</li>
                            <li>Verify the URL matches your project URL</li>
                            <li>Copy new credentials if you created a new project</li>
                            <li>Click "Update Supabase Credentials" above to save new config</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupabaseDiagnostic;
