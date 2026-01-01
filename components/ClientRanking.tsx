import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Trophy, Medal, Award, Crown, TrendingUp, Users } from 'lucide-react';
import * as db from '../services/db';
import { supabase } from '../lib/supabase';

interface ClientRankingProps {
  teams: Team[];
  gameId: string;
}

const ClientRanking: React.FC<ClientRankingProps> = ({ teams: initialTeams, gameId }) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  // Real-time updates
  useEffect(() => {
    // Subscribe to team updates
    const subscription = supabase
      .channel(`teams-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `game_id=eq.${gameId}`
      }, async () => {
        // Reload teams when changes detected
        const updatedTeams = await db.fetchTeams(gameId);
        setTeams(updatedTeams);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [gameId]);

  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  const getTeamColor = (teamName: string) => {
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-7 h-7 text-gray-300" />;
      case 3:
        return <Award className="w-7 h-7 text-orange-400" />;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-sm font-black text-white">#{rank}</span>
          </div>
        );
    }
  };

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 font-bold">No teams registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
          <Trophy className="w-7 h-7 text-yellow-400" />
          Leaderboard
        </h2>
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-lg px-3 py-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-green-400 uppercase">Live</span>
        </div>
      </div>

      {/* Podium - Top 3 */}
      {sortedTeams.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <div className="text-center pt-8">
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-400 rounded-xl p-4 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Medal className="w-8 h-8 text-gray-300" />
              </div>
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white"
                style={{ backgroundColor: getTeamColor(sortedTeams[1].name) }}
              />
              <p className="font-bold text-white text-sm mb-1">{sortedTeams[1].name}</p>
              <p className="text-2xl font-black text-white">{sortedTeams[1].score}</p>
              <p className="text-xs text-gray-400 uppercase">Points</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 border-2 border-yellow-300 rounded-xl p-4 relative transform scale-110">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Crown className="w-10 h-10 text-yellow-200 animate-pulse" />
              </div>
              <div
                className="w-16 h-16 rounded-full mx-auto mb-2 border-3 border-white shadow-lg"
                style={{ backgroundColor: getTeamColor(sortedTeams[0].name) }}
              />
              <p className="font-black text-white text-base mb-1">{sortedTeams[0].name}</p>
              <p className="text-3xl font-black text-white">{sortedTeams[0].score}</p>
              <p className="text-xs text-yellow-100 uppercase font-bold">Champion</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="text-center pt-8">
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 border-2 border-orange-400 rounded-xl p-4 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Award className="w-8 h-8 text-orange-300" />
              </div>
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white"
                style={{ backgroundColor: getTeamColor(sortedTeams[2].name) }}
              />
              <p className="font-bold text-white text-sm mb-1">{sortedTeams[2].name}</p>
              <p className="text-2xl font-black text-white">{sortedTeams[2].score}</p>
              <p className="text-xs text-orange-200 uppercase">Points</p>
            </div>
          </div>
        </div>
      )}

      {/* Full List */}
      <div className="space-y-2">
        {sortedTeams.map((team, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <div
              key={team.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isTopThree
                  ? rank === 1
                    ? 'bg-gradient-to-r from-yellow-900/30 to-transparent border-yellow-500/50'
                    : rank === 2
                    ? 'bg-gradient-to-r from-gray-700/30 to-transparent border-gray-500/50'
                    : 'bg-gradient-to-r from-orange-900/30 to-transparent border-orange-500/50'
                  : 'bg-purple-900/20 border-purple-500/30 hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Icon */}
                <div className="flex-shrink-0">
                  {getRankIcon(rank)}
                </div>

                {/* Team Color Dot */}
                <div
                  className="w-4 h-4 rounded-full border-2 border-white flex-shrink-0"
                  style={{ backgroundColor: getTeamColor(team.name) }}
                />

                {/* Team Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-lg truncate">{team.name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {team.members?.length || 0} members
                    </span>
                    {team.completedPointIds && team.completedPointIds.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-400">
                          {team.completedPointIds.length} completed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-3xl font-black ${
                      rank === 1
                        ? 'text-yellow-400'
                        : rank === 2
                        ? 'text-gray-300'
                        : rank === 3
                        ? 'text-orange-400'
                        : 'text-white'
                    }`}
                  >
                    {team.score}
                  </p>
                  <p className="text-xs text-gray-500 uppercase font-bold">points</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientRanking;
