import React, { useState, useEffect } from 'react';
import { X, Users, UserX, UserCheck, Shield } from 'lucide-react';
import { teamSync } from '../services/teamSync';
import { TeamMember } from '../types';

interface TeamLobbyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isCaptain: boolean;
}

const TeamLobbyPanel: React.FC<TeamLobbyPanelProps> = ({ isOpen, onClose, isCaptain }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const myDeviceId = teamSync.getDeviceId();

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = teamSync.subscribeToMembers((members) => {
      setTeamMembers(members);
    });

    // Get initial members
    setTeamMembers(teamSync.getAllMembers());

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const handleRetirePlayer = (deviceId: string) => {
    if (isCaptain) {
      teamSync.retirePlayer(deviceId);
    }
  };

  const handleUnretirePlayer = (deviceId: string) => {
    if (isCaptain) {
      teamSync.unretirePlayer(deviceId);
    }
  };

  const handleRetireMyself = () => {
    if (confirm('Are you sure you want to retire from voting? Your votes will not count until you rejoin.')) {
      teamSync.retireMyself();
    }
  };

  const handleUnretireMyself = () => {
    teamSync.unretireMyself();
  };

  if (!isOpen) return null;

  const myMember = teamMembers.find(m => m.deviceId === myDeviceId);
  const otherMembers = teamMembers.filter(m => m.deviceId !== myDeviceId);

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-blue-100 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Lobby</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} online
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 transition-colors">
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isCaptain && (
            <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Captain Controls</p>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                You can retire members who are no longer playing. Their votes won't count.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {/* My Card */}
            {myMember && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {myMember.photoUrl ? (
                      <img 
                        src={myMember.photoUrl} 
                        alt={myMember.userName} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-400 dark:bg-blue-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {myMember.userName}
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase font-black">You</span>
                        {myMember.role === 'captain' && (
                          <Shield className="w-4 h-4 text-orange-500" />
                        )}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {myMember.isRetired ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">🚫 RETIRED</span>
                        ) : myMember.isSolving ? (
                          <span className="text-green-600 dark:text-green-400">📝 Solving task...</span>
                        ) : (
                          <span>✅ Active</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Self-Retire Button */}
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  {myMember.isRetired ? (
                    <button
                      onClick={handleUnretireMyself}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      REJOIN VOTING
                    </button>
                  ) : (
                    <button
                      onClick={handleRetireMyself}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      RETIRE FROM VOTING
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Other Team Members */}
            {otherMembers.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Teammates
                </h3>
                {otherMembers.map((member) => (
                  <div 
                    key={member.deviceId}
                    className={`border-2 rounded-xl p-4 transition-all ${
                      member.isRetired 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60' 
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {member.photoUrl ? (
                          <img 
                            src={member.photoUrl} 
                            alt={member.userName} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {member.userName}
                            {member.role === 'captain' && (
                              <Shield className="w-4 h-4 text-orange-500" />
                            )}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {member.isRetired ? (
                              <span className="text-red-600 dark:text-red-400 font-bold">🚫 RETIRED</span>
                            ) : member.isSolving ? (
                              <span className="text-green-600 dark:text-green-400">📝 Solving task...</span>
                            ) : (
                              <span>✅ Active</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Captain Controls */}
                    {isCaptain && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        {member.isRetired ? (
                          <button
                            onClick={() => handleUnretirePlayer(member.deviceId)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <UserCheck className="w-4 h-4" />
                            ACTIVATE PLAYER
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRetirePlayer(member.deviceId)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <UserX className="w-4 h-4" />
                            RETIRE PLAYER
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLobbyPanel;
