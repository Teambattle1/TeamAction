import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CooldownTimerProps {
  taskId: string;
  remainingSeconds: number;
  onCooldownExpired?: () => void;
  className?: string;
}

/**
 * Displays a cooldown timer for a task that was answered incorrectly
 * Shows countdown from 2 minutes (120 seconds) to 0
 */
const CooldownTimer: React.FC<CooldownTimerProps> = ({
  taskId,
  remainingSeconds,
  onCooldownExpired,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(remainingSeconds);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onCooldownExpired?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          onCooldownExpired?.();
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, onCooldownExpired]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / 120) * 100; // 120 seconds = 2 minutes

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <div className="text-xs font-bold text-red-300 uppercase">Cooldown Active</div>
      </div>

      {/* Timer Display */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-red-400">{minutes}</span>
          <span className="text-xs text-red-300">:</span>
          <span className="text-2xl font-bold text-red-400">{String(seconds).padStart(2, '0')}</span>
          <span className="text-xs text-red-300">remaining</span>
        </div>

        <div className="text-right text-xs text-red-300">
          Try another task
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-red-950 rounded-full overflow-hidden border border-red-800">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="text-[10px] text-red-300 text-center">
        Wrong answer penalty: 2 minute cooldown
      </div>
    </div>
  );
};

export default CooldownTimer;
