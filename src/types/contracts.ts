/**
 * Cross-Repo Contract Adapter for football-stats
 * Implements / re-exports the canonical contracts defined in contracts/index.ts.
 */

export type {
  SupportedSport,
  MatchdayContextContract,
  SportStatsContract,
  CrossRepoQueryContract
} from '../../../contracts/index';

import type { SportStatsContract, CrossRepoQueryContract } from '../../../contracts/index';

/**
 * Transforms internal football statistics into the canonical SportStatsContract.
 */
export function formatFootballStatsContract(data: {
  matchId: string;
  recentForm?: string[];
  rank?: number;
  totalTeams?: number;
  points?: number;
  playedMatches?: number;
  h2h?: { wins: number; draws: number; losses: number; lastResult?: string };
  topScorerName?: string;
  topScorerGoals?: number;
  baseUrl?: string;
}): SportStatsContract {
  const base = data.baseUrl || 'https://football-stats.pages.dev';
  return {
    sport: 'football',
    matchOrTeamId: data.matchId,
    recentForm: data.recentForm,
    standingsSummary: data.rank && data.totalTeams && data.points !== undefined && data.playedMatches !== undefined ? {
      rank: data.rank,
      totalTeams: data.totalTeams,
      points: data.points,
      playedMatches: data.playedMatches
    } : undefined,
    headToHead: data.h2h,
    keyMetrics: {
      ...(data.topScorerName ? { topScorer: `${data.topScorerName} (${data.topScorerGoals || 0}g)` } : {})
    },
    deepLinkUrl: `${base}/match/${data.matchId}?theme=night-captain`
  };
}

/**
 * Parses incoming query params according to CrossRepoQueryContract.
 */
export function parseIncomingCrossRepoQuery(searchParams: URLSearchParams): CrossRepoQueryContract {
  return {
    theme: searchParams.get('theme') || 'night-captain',
    embed: searchParams.get('embed') === 'true',
    parentOrigin: searchParams.get('parentOrigin') || undefined,
    targetId: searchParams.get('targetId') || searchParams.get('matchId') || undefined
  };
}
