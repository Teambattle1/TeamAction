import React, { useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

interface NotificationModalProps {
    message: string;
    type?: 'success' | 'warning' | 'error';
    onClose: () => void;
    autoClose?: boolean;
    duration?: number;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
    message,
    type = 'success',
    onClose,
    autoClose = true,
    duration = 3000
}) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    const bgColor = {
        success: 'bg-green-900/80 border-green-500',
        warning: 'bg-amber-900/80 border-amber-500',
        error: 'bg-red-900/80 border-red-500'
    }[type];

    const textColor = {
        success: 'text-green-200',
        warning: 'text-amber-200',
        error: 'text-red-200'
    }[type];

    const Icon = {
        success: Check,
        warning: AlertCircle,
        error: AlertCircle
    }[type];

    return (
        <div className="fixed inset-0 z-[7001] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className={`${bgColor} border rounded-2xl p-6 max-w-md shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-5`}>
                <Icon className={`w-6 h-6 flex-shrink-0 mt-1 ${textColor}`} />
                <div className="flex-1">
                    <p className={`${textColor} font-semibold text-lg leading-relaxed`}>{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className={`flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors ${textColor}`}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default NotificationModal;
