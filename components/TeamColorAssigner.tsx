import React, { useMemo } from 'react';
import { Team } from '../types';

interface TeamColorAssignerProps {
  teams: Team[];
  teamColors?: Record<string, string>;
  onColorsAssigned?: (colors: Record<string, string>) => void;
}

// Predefined distinct team colors for elimination mode
const ELIMINATION_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Cyan', hex: '#06B6D4' },
];

export const getDefaultTeamColors = (teams: Team[]): Record<string, string> => {
  const colors: Record<string, string> = {};
  teams.forEach((team, index) => {
    colors[team.id] = ELIMINATION_COLORS[index % ELIMINATION_COLORS.length].hex;
  });
  return colors;
};

/**
 * Component for assigning and visualizing team colors in elimination mode
 * Can be used in the game setup or during the game
 */
const TeamColorAssigner: React.FC<TeamColorAssignerProps> = ({
  teams,
  teamColors: providedColors,
  onColorsAssigned,
}) => {
  const teamColors = useMemo(() => {
    return providedColors || getDefaultTeamColors(teams);
  }, [teams, providedColors]);

  const handleColorChange = (teamId: string, newColor: string) => {
    const updated = { ...teamColors, [teamId]: newColor };
    onColorsAssigned?.(updated);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase">Team Colors</div>
      
      <div className="grid grid-cols-2 gap-3">
        {teams.map(team => {
          const teamColor = teamColors[team.id];
          
          return (
            <div
              key={team.id}
              className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700"
            >
              {/* Color Badge */}
              <div
                className="w-8 h-8 rounded-lg border-2 border-slate-600 flex-shrink-0 cursor-pointer hover:border-slate-400 transition-colors"
                style={{ backgroundColor: teamColor }}
                onClick={() => {
                  // Cycle through colors
                  const currentIndex = ELIMINATION_COLORS.findIndex(c => c.hex === teamColor);
                  const nextColor = ELIMINATION_COLORS[(currentIndex + 1) % ELIMINATION_COLORS.length];
                  handleColorChange(team.id, nextColor.hex);
                }}
                title="Click to cycle color"
              />
              
              {/* Team Name */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-300 truncate">{team.name}</div>
                <div className="text-[10px] text-slate-500 truncate">
                  {ELIMINATION_COLORS.find(c => c.hex === teamColor)?.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Color Legend */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Available Colors</div>
        <div className="grid grid-cols-4 gap-2">
          {ELIMINATION_COLORS.map(color => (
            <div
              key={color.hex}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-6 h-6 rounded-lg border border-slate-600"
                style={{ backgroundColor: color.hex }}
              />
              <div className="text-[9px] text-slate-500 text-center truncate">{color.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamColorAssigner;
