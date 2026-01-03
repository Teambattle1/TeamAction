import React, { useState, useEffect } from 'react';
import { Bomb, Clock, AlertTriangle } from 'lucide-react';

interface TimeBombIndicatorProps {
  startedAt: number; // Timestamp when timer started
  duration: number; // Duration in seconds
  onExpire: () => void; // Callback when timer reaches zero
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const TimeBombIndicator: React.FC<TimeBombIndicatorProps> = ({ 
  startedAt, 
  duration, 
  onExpire, 
  size = 'medium',
  showIcon = true 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startedAt) / 1000); // Seconds elapsed
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeRemaining(remaining);

      // Check if expired
      if (remaining === 0 && !hasExpired) {
        setHasExpired(true);
        onExpire();
      }
    };

    // Initial calculation
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [startedAt, duration, hasExpired, onExpire]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return (timeRemaining / duration) * 100;
  };

  const getColorClass = (): string => {
    const percentage = getProgressPercentage();
    if (percentage > 50) return 'text-green-500 border-green-500 bg-green-500';
    if (percentage > 20) return 'text-yellow-500 border-yellow-500 bg-yellow-500';
    return 'text-red-500 border-red-500 bg-red-500';
  };

  const getColorClassBg = (): string => {
    const percentage = getProgressPercentage();
    if (percentage > 50) return 'bg-green-500/20 border-green-500';
    if (percentage > 20) return 'bg-yellow-500/20 border-yellow-500';
    return 'bg-red-500/20 border-red-500 animate-pulse';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'text-xs p-2',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'large':
        return {
          container: 'text-xl p-4',
          icon: 'w-6 h-6',
          text: 'text-2xl'
        };
      default: // medium
        return {
          container: 'text-sm p-3',
          icon: 'w-4 h-4',
          text: 'text-lg'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const colorClass = getColorClass();
  const colorClassBg = getColorClassBg();

  if (hasExpired) {
    return (
      <div className={`${sizeClasses.container} ${colorClassBg} border-2 rounded-xl flex items-center gap-2 font-bold`}>
        {showIcon && <AlertTriangle className={`${sizeClasses.icon} ${colorClass}`} />}
        <span className={colorClass}>TIME EXPIRED</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses.container} ${colorClassBg} border-2 rounded-xl`}>
      <div className="flex items-center gap-3">
        {showIcon && (
          <div className="relative">
            <Bomb className={`${sizeClasses.icon} ${colorClass}`} />
            {timeRemaining <= 10 && (
              <div className={`absolute -top-1 -right-1 w-2 h-2 ${colorClass.split(' ')[2]} rounded-full animate-ping`} />
            )}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Clock className={`${sizeClasses.icon} ${colorClass} opacity-70`} />
              <span className={`font-black ${sizeClasses.text} ${colorClass} font-mono`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colorClass.split(' ')[2]} transition-all duration-1000 ease-linear`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Urgent Warning */}
      {timeRemaining <= 30 && timeRemaining > 0 && (
        <div className="mt-2 pt-2 border-t border-red-500/30">
          <p className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            URGENT: TIME RUNNING OUT
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeBombIndicator;
