import { useEffect, useState } from 'react';
import { getGroups, getGroupFull, getTeamProfile, getPlayerData, batchFetch } from '../services/api';
import { loadTournamentData } from '../services/tournamentLoader';
import { MATCH_STATUS } from '../types';
import type { StandingTeam, TeamRosterPlayer, PlayerStatsEntry, GroupDetails, PlayerStats } from '../types';
import { processPlayerMatchHistory } from '../utils/dataProcessors';
import { APP_CONFIG } from '../config';
import type { MatchWithVenue, PlayoffInfo } from '../components/tournament';

export interface TournamentPlayerStats extends PlayerStats {
  player_id: string;
}

export interface UseTournamentDataOptions {
  turnaus?: string;
  sarja?: string;
  teamId: string;
  decodedTeam: string;
  hostParam?: string | null;
}

export function useTournamentData({
  turnaus,
  sarja,
  teamId,
  decodedTeam,
  hostParam,
}: UseTournamentDataOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [compName, setCompName] = useState('');
  const [catName, setCatName] = useState('');
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [matches, setMatches] = useState<MatchWithVenue[]>([]);

  const [teamName, setTeamName] = useState(decodedTeam && !/^\d+$/.test(decodedTeam) ? decodedTeam : '');
  const [teamCrest, setTeamCrest] = useState('');
  const [players, setPlayers] = useState<TeamRosterPlayer[]>([]);
  const [processedPlayers, setProcessedPlayers] = useState<TournamentPlayerStats[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [playerStats, setPlayerStats] = useState<PlayerStatsEntry[]>([]);
  const [playoffs, setPlayoffs] = useState<PlayoffInfo[]>([]);
  const [expandedPlayoff, setExpandedPlayoff] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<GroupDetails[]>([]);

  useEffect(() => {
    if (!turnaus || !sarja) return;
    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const tHost = hostParam || (turnaus === 'lime_0016' ? 'vierumaki-turnaus5-2026.torneopal.fi' : '');
        if (tHost) {
          const tData = await loadTournamentData({
            host: tHost,
            turnaus,
            sarja,
            teamId: teamId || '201313',
            rawUrl: '',
          });
          if (cancelled) return;
          setCompName(tData.tournamentTitle);
          setCatName(tData.categoryName);
          setGroupName(tData.groupName || 'Lohko B');
          setTeamName(tData.teamName || (decodedTeam && !/^\d+$/.test(decodedTeam) ? decodedTeam : 'PPJ/Laru Sininen'));
          setStandings(tData.standings.map((s) => {
            const gParts = s.goals.split('-');
            const gf = parseInt(gParts[0] || '0', 10);
            const ga = parseInt(gParts[1] || '0', 10);
            return {
              team_id: s.teamId || s.teamName,
              team_name: s.teamName,
              current_standing: String(s.rank),
              matches_played: s.played,
              matches_won: s.wins,
              matches_tied: s.draws,
              matches_lost: s.losses,
              goals_for: gf,
              goals_against: ga,
              goals_diff: gf - ga,
              points: s.points,
            };
          }));
          setMatches(tData.matches.map((m) => {
            const dParts = m.date.split('.');
            const isoDate = dParts.length === 3 ? `${dParts[2]}-${dParts[1]}-${dParts[0]}` : m.date;
            const scoreParts = m.score.includes('–') ? m.score.split('–') : m.score.split('-');
            return {
              match_id: m.matchId || m.matchNumber,
              date: isoDate,
              time: m.time,
              team_A_id: m.homeTeam,
              team_B_id: m.awayTeam,
              team_A_name: m.homeTeam,
              team_B_name: m.awayTeam,
              fs_A: scoreParts[0]?.trim() || '',
              fs_B: scoreParts[1]?.trim() || '',
              winner_id: '',
              status: m.status === 'played' ? MATCH_STATUS.PLAYED : MATCH_STATUS.FIXTURE,
              venue_name: m.pitch,
            };
          }));
          setLoading(false);
          return;
        }

        const groups = await getGroups(turnaus, sarja);
        setAllGroups(groups);
        const found = groups.find((g) =>
          g.teams?.some((t) => String(t.team_id) === teamId)
        );
        if (!found) throw new Error('Joukkuetta ei löydy tästä turnauksesta');

        setGroupId(found.group_id);
        setGroupName(found.group_name || '');
        setCompName(found.competition_name || '');
        setCatName(found.category_name || '');
        setStandings(found.teams || []);

        const [groupData, teamData] = await Promise.all([
          getGroupFull(turnaus, sarja, found.group_id, controller.signal),
          getTeamProfile(teamId, controller.signal),
        ]);

        if (cancelled) return;

        if (groupData?.matches) {
          setMatches(groupData.matches as MatchWithVenue[]);
        }
        if (groupData?.player_statistics) {
          setPlayerStats(groupData.player_statistics);
        }
        if (teamData) {
          setTeamName(teamData.team_name || '');
          setTeamCrest(teamData.crest || '');
          setPlayers(teamData.players || []);
        }

        const playoffGroups = groups.filter((g) => !g.teams?.length && g.group_id !== found.group_id);
        if (playoffGroups.length > 0) {
          const playoffLabels = playoffGroups.map((g) => ({
            id: g.group_id,
            name: g.group_name || `Lohko ${g.group_id}`,
            label: g.group_name || '',
          }));
          const playoffResults = await batchFetch(
            playoffLabels.map((p) => p.id),
            (id, signal) => getGroupFull(turnaus, sarja, id, signal),
            3,
            controller.signal
          );
          if (cancelled) return;
          const parsedPlayoffs = playoffLabels.map((p, i) => ({
            ...p,
            matches: (playoffResults[i]?.matches || []) as MatchWithVenue[],
          }));
          setPlayoffs(parsedPlayoffs);
        }

        setLoading(false);

        if (teamData?.players && teamData.players.length > 0) {
          setLoadingPlayers(true);
          const playerIds = teamData.players.map((p) => p.player_id).filter((id): id is string => !!id);
          const playerDataList = await batchFetch(playerIds, getPlayerData, 5, controller.signal);
          
          if (cancelled) return;

          const processed: TournamentPlayerStats[] = [];
          for (let idx = 0; idx < teamData.players.length; idx++) {
            const rosterPlayer = teamData.players[idx];
            const pData = playerDataList[idx];
            if (!pData) continue;

            const processedHistory = processPlayerMatchHistory(
              pData.matches,
              APP_CONFIG.CURRENT_YEAR,
              APP_CONFIG.PREVIOUS_YEAR,
              teamData.team_name || ''
            );

            processed.push({
              player_id: rosterPlayer.player_id || '',
              name: `${rosterPlayer.first_name || ''} ${rosterPlayer.last_name || ''}`.trim(),
              shirtNumber: rosterPlayer.shirt_number || 'N/A',
              birthYear: rosterPlayer.birthyear || pData.birthyear || '',
              img_url: rosterPlayer.img_url || pData.img_url,
              ...processedHistory,
              isCaptainInMatch: false,
              teamIdInMatch: teamId,
            });
          }
          setProcessedPlayers(processed);
          setLoadingPlayers(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Turnaustietojen lataus epäonnistui');
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [turnaus, sarja, teamId, decodedTeam, hostParam]);

  return {
    loading,
    error,
    groupId,
    groupName,
    compName,
    catName,
    standings,
    matches,
    teamName,
    teamCrest,
    players,
    processedPlayers,
    loadingPlayers,
    playerStats,
    playoffs,
    expandedPlayoff,
    setExpandedPlayoff,
    allGroups,
  };
}
