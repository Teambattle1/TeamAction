
import React, { useEffect, useState } from 'react';
import { X, MessageSquare, AlertTriangle, Radio } from 'lucide-react';

interface MessagePopupProps {
  message: string;
  sender: string;
  onClose: () => void;
}

const MessagePopup: React.FC<MessagePopupProps> = ({ message, sender, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setVisible(true), 10);
  }, []);

  const handleClose = () => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 transition-all duration-300 ${visible ? 'bg-black/80 backdrop-blur-md' : 'bg-black/0 pointer-events-none'}`}>
        <div 
            className={`w-full max-w-lg bg-orange-600 rounded-3xl shadow-2xl p-8 text-center relative border-4 border-orange-400 overflow-hidden transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-400 rounded-full blur-3xl opacity-50" />
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                    <MessageSquare className="w-10 h-10 text-orange-600" />
                </div>
                
                <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-md">INCOMING MESSAGE</h2>
                <div className="bg-orange-800/30 px-4 py-1 rounded-full mb-6 border border-orange-400/30">
                    <span className="text-xs font-bold text-orange-100 uppercase tracking-widest flex items-center gap-2">
                        <Radio className="w-3 h-3 animate-pulse" /> FROM: {sender}
                    </span>
                </div>

                <div className="bg-white/10 rounded-2xl p-6 mb-8 w-full border border-white/20 backdrop-blur-sm">
                    <p className="text-xl md:text-2xl font-bold text-white leading-relaxed font-mono">
                        "{message}"
                    </p>
                </div>

                <button 
                    onClick={handleClose}
                    className="w-full py-4 bg-white text-orange-600 rounded-xl font-black text-lg uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <CheckCircleIcon className="w-6 h-6" /> RECEIVED
                </button>
            </div>
        </div>
    </div>
  );
};

// Simple internal icon component to avoid huge import list if missing
const CheckCircleIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default MessagePopup;
