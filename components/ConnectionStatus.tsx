import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { testDatabaseConnection } from '../services/db';

const ConnectionStatus: React.FC = () => {
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'hidden'>('hidden');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [latency, setLatency] = useState<number>(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const checkConnection = async (showSuccess: boolean = false) => {
        setConnectionStatus('checking');
        setIsRetrying(true);

        const result = await testDatabaseConnection();

        if (result.success) {
            setLatency(result.latency || 0);
            if (showSuccess) {
                setConnectionStatus('connected');
                setTimeout(() => setConnectionStatus('hidden'), 3000);
            } else {
                setConnectionStatus('hidden');
            }
        } else {
            setConnectionStatus('error');
            setErrorMessage(result.error || 'Unknown error');
        }

        setIsRetrying(false);
    };

    useEffect(() => {
        // Initial connection test
        checkConnection();

        // Periodic connection check (every 30 seconds)
        const interval = setInterval(() => {
            if (connectionStatus !== 'error') {
                checkConnection();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (connectionStatus === 'hidden') return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center p-3 transition-all ${
            connectionStatus === 'error' 
                ? 'bg-red-600' 
                : connectionStatus === 'checking'
                ? 'bg-yellow-600'
                : 'bg-green-600'
        }`}>
            <div className="flex items-center gap-3 text-white">
                {connectionStatus === 'error' && (
                    <>
                        <WifiOff className="w-5 h-5 animate-pulse" />
                        <div className="flex-1">
                            <p className="font-bold text-sm">Database Connection Error</p>
                            <p className="text-xs opacity-90">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => checkConnection(true)}
                            disabled={isRetrying}
                            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                            Retry
                        </button>
                    </>
                )}
                {connectionStatus === 'checking' && (
                    <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <p className="font-bold text-sm">Checking connection...</p>
                    </>
                )}
                {connectionStatus === 'connected' && (
                    <>
                        <Wifi className="w-5 h-5" />
                        <p className="font-bold text-sm">Connected ({latency}ms)</p>
                    </>
                )}
            </div>

            {connectionStatus === 'error' && (
                <button
                    onClick={() => setConnectionStatus('hidden')}
                    className="ml-4 p-1 hover:bg-white/20 rounded"
                    title="Dismiss"
                >
                    <span className="text-white text-lg">&times;</span>
                </button>
            )}
        </div>
    );
};

export default ConnectionStatus;
