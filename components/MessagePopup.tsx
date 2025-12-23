import React, { useEffect, useState } from 'react';
import { CheckCircle, MessageSquare, AlertTriangle, Radio, Siren, Clock } from 'lucide-react';

interface MessagePopupProps {
  message: string;
  sender: string;
  onClose: () => void;
  isUrgent?: boolean;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ message, sender, onClose, isUrgent = false }) => {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(isUrgent ? 10 : 0);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setVisible(true), 10);
  }, []);

  useEffect(() => {
      if (isUrgent && countdown > 0) {
          const timer = setInterval(() => {
              setCountdown(prev => prev - 1);
          }, 1000);
          return () => clearInterval(timer);
      }
  }, [isUrgent, countdown]);

  const handleClose = () => {
      if (isUrgent && countdown > 0) return; // Block close
      setVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 transition-all duration-300 ${visible ? (isUrgent ? 'bg-red-950/90 backdrop-blur-lg' : 'bg-black/80 backdrop-blur-md') : 'bg-black/0 pointer-events-none'}`}>
        <div 
            className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 text-center relative border-4 overflow-hidden transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) 
                ${isUrgent ? 'bg-red-700 border-red-500 shadow-red-900/50' : 'bg-orange-600 border-orange-400'} 
                ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-50 ${isUrgent ? 'bg-red-400' : 'bg-orange-400'}`} />
            
            <div className="relative z-10 flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${isUrgent ? 'bg-white animate-pulse' : 'bg-white animate-bounce'}`}>
                    {isUrgent ? <Siren className="w-10 h-10 text-red-600" /> : <MessageSquare className="w-10 h-10 text-orange-600" />}
                </div>
                
                <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-md">
                    {isUrgent ? 'URGENT MESSAGE' : 'INCOMING MESSAGE'}
                </h2>
                <div className={`${isUrgent ? 'bg-red-900/40 border-red-400/30' : 'bg-orange-800/30 border-orange-400/30'} px-4 py-1 rounded-full mb-6 border`}>
                    <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isUrgent ? 'text-red-100' : 'text-orange-100'}`}>
                        <Radio className="w-3 h-3 animate-pulse" /> FROM: {sender}
                    </span>
                </div>

                <div className={`bg-white/10 rounded-2xl p-6 mb-8 w-full border border-white/20 backdrop-blur-sm ${isUrgent ? 'border-red-400/50' : ''}`}>
                    <p className="text-xl md:text-2xl font-bold text-white leading-relaxed font-mono">
                        "{message}"
                    </p>
                </div>

                <button 
                    onClick={handleClose}
                    disabled={isUrgent && countdown > 0}
                    className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all 
                        ${isUrgent 
                            ? (countdown > 0 ? 'bg-gray-400 text-gray-700 cursor-not-allowed grayscale blur-[1px]' : 'bg-white text-red-600 hover:scale-[1.02] active:scale-95') 
                            : 'bg-white text-orange-600 hover:scale-[1.02] active:scale-95'}`}
                >
                    {isUrgent && countdown > 0 ? (
                        <>
                            <Clock className="w-6 h-6 animate-spin" /> WAIT {countdown}s
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-6 h-6" /> {isUrgent ? 'ACKNOWLEDGE' : 'RECEIVED'}
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default MessagePopup;