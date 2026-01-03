/**
 * Vibration Utility
 * Provides phone vibration for notifications and alerts
 */

/**
 * Checks if vibration is supported on the current device
 */
export const isVibrationSupported = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Triggers a single vibration pulse
 * @param duration - Duration in milliseconds (default: 200ms)
 */
export const vibrate = (duration: number = 200): void => {
  if (!isVibrationSupported()) {
    console.log('[Vibration] Not supported on this device');
    return;
  }

  try {
    navigator.vibrate(duration);
  } catch (error) {
    console.error('[Vibration] Error triggering vibration:', error);
  }
};

/**
 * Triggers a pattern of vibrations
 * @param pattern - Array of durations [vibrate, pause, vibrate, pause...]
 * Example: [200, 100, 200] = vibrate 200ms, pause 100ms, vibrate 200ms
 */
export const vibratePattern = (pattern: number[]): void => {
  if (!isVibrationSupported()) {
    console.log('[Vibration] Not supported on this device');
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.error('[Vibration] Error triggering vibration pattern:', error);
  }
};

/**
 * Stops any ongoing vibration
 */
export const stopVibration = (): void => {
  if (!isVibrationSupported()) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.error('[Vibration] Error stopping vibration:', error);
  }
};

/**
 * Predefined vibration patterns for common notifications
 */
export const VibrationPatterns = {
  // Single short pulse
  tap: [50],
  
  // Standard notification
  notification: [200],
  
  // Urgent/Important notification
  urgent: [200, 100, 200, 100, 200],
  
  // Success feedback
  success: [100, 50, 100],
  
  // Error/Warning
  error: [300, 100, 300],
  
  // Attention grabber
  alert: [150, 100, 150, 100, 150, 100, 150],
};

/**
 * Vibrates for a chat notification
 * @param isUrgent - Whether the message is urgent (longer vibration)
 */
export const vibrateChatNotification = (isUrgent: boolean = false): void => {
  if (isUrgent) {
    vibratePattern(VibrationPatterns.urgent);
  } else {
    vibratePattern(VibrationPatterns.notification);
  }
};

/**
 * Vibrates for a general notification
 */
export const vibrateNotification = (): void => {
  vibratePattern(VibrationPatterns.notification);
};

/**
 * Vibrates for success feedback
 */
export const vibrateSuccess = (): void => {
  vibratePattern(VibrationPatterns.success);
};

/**
 * Vibrates for error/warning
 */
export const vibrateError = (): void => {
  vibratePattern(VibrationPatterns.error);
};
