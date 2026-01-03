/**
 * Team History Data Types
 * For visualizing historical movement and task performance
 */

export interface TaskAttempt {
  id: string;
  coordinate: { lat: number; lng: number };
  status: 'CORRECT' | 'WRONG' | 'SUBMITTED';
  timestamp: number;
  taskTitle?: string;
}

export interface TeamHistory {
  teamId: string;
  teamName: string;
  color: string; // Hex code for the team's path
  path: Array<{ lat: number; lng: number; timestamp: number }>; // The breadcrumb trail
  tasks: TaskAttempt[];
}
