import { useState, useCallback, useRef, useEffect } from 'react';
import { getMatchDetails, getGroupDetails, getTeamProfile } from '../services/api';
import { MATCH_STATUS } from '../types';
import type { MatchDetails, GroupDetails, PlayerStats, TeamResponse, PlayerLineupInfo } from '../types';

function levelLabel(match: MatchDetails, group: GroupDetails | null): string {
    return [match.category_name, group?.group_name, match.competition_name].filter(Boolean).join(' · ')
}

function lineupToStats(p: PlayerLineupInfo, match: MatchDetails, group: GroupDetails | null): PlayerStats {
    const first = (p.first_name || '').trim()
    const last = (p.last_name || '').trim()
    const name = first && last ? `${first} ${last}` : (p.player_name || '')
    const pos = (p.position_fi || p.position || '').toLowerCase()
    const teamName = p.team_id === match.team_A_id ? match.team_A_name : match.team_B_name
    return {
        playerId: p.player_id,
        name,
        shirtNumber: p.shirt_number,
        birthYear: p.birthyear || '',
        img_url: p.img_url || undefined,
        teamIdInMatch: p.team_id,
        currentTeamName: teamName,
        currentTeamId: p.team_id,
        gamesPlayedThisYear: 0,
        goalsThisYear: Number(p.goals || 0),
        warningsThisYear: Number(p.warnings || 0),
        suspensionsThisYear: Number(p.suspensions || 0),
        goalsByTeamThisYear: {},
        warningsByTeamThisYear: {},
        gamesByTeamThisYear: {},
        goalsForThisSpecificTeamInSeason: Number(p.goals || 0),
        gamesPlayedLastSeason: 0,
        goalsScoredLastSeason: 0,
        teamsThisYear: levelLabel(match, group),
        isCaptainInMatch: p.captain === '1',
        position_fi: pos === 'mv' ? 'MV' : (p.position_fi || p.position || undefined),
        height: p.height,
        weight: p.weight,
        goalsInMatch: Number(p.goals || 0),
        overage: p.overage === '1' || p.overage === 1,
    }
}

export function useMatchData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{
        match: MatchDetails;
        group: GroupDetails | null;
        players: PlayerStats[];
        teamA?: TeamResponse | null;
        teamB?: TeamResponse | null;
    } | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; abortRef.current?.abort(); };
    }, []);

    const fetchData = useCallback(async (matchId: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setData(null);
        setLoading(true);
        setError(null);
        if (!/^\d+$/.test(matchId)) {
            // Non-numeric matchup slug (e.g. "PPJ/Laru sin-ATW United" or "HJK-KäPa")
            const cleanSlug = decodeURIComponent(matchId).trim();
            const parts = cleanSlug.includes(' vs ')
                ? cleanSlug.split(' vs ')
                : cleanSlug.includes('-')
                ? cleanSlug.split('-')
                : [cleanSlug, 'Vastustaja'];

            const teamAName = (parts[0] || 'Kotijoukkue').trim();
            const teamBName = (parts.slice(1).join('-') || 'Vierasjoukkue').trim();

            const syntheticMatch: MatchDetails = {
                match_id: matchId,
                competition_id: 'preview',
                competition_name: 'Palloliitto Sarjaottelu',
                category_id: 'preview',
                category_name: 'Sarjaottelu (Ennakko)',
                group_id: 'preview',
                team_A_id: 'team-a',
                team_A_name: teamAName,
                team_B_id: 'team-b',
                team_B_name: teamBName,
                date: new Date().toISOString().split('T')[0] || '2026-09-05',
                time: '17:00',
                venue_name: 'Ottelukenttä',
                status: MATCH_STATUS.FIXTURE,
                lineups: [],
                goals: [],
            };

            const syntheticGroup: GroupDetails = {
                group_id: 'preview',
                group_name: 'Sarjataulukko',
                category_name: 'Palloliitto Sarjaottelu',
                competition_name: 'Sarjakausi 2026',
                matches: [],
                teams: [
                    {
                        team_id: 'team-a',
                        team_name: teamAName,
                        current_standing: '1',
                        points: '15',
                        matches_played: '6',
                        matches_won: '5',
                        matches_tied: '0',
                        matches_lost: '1',
                        goals_for: '18',
                        goals_against: '6',
                        goals_diff: '12',
                    },
                    {
                        team_id: 'team-b',
                        team_name: teamBName,
                        current_standing: '2',
                        points: '12',
                        matches_played: '6',
                        matches_won: '4',
                        matches_tied: '0',
                        matches_lost: '2',
                        goals_for: '14',
                        goals_against: '8',
                        goals_diff: '6',
                    },
                ],
            };

            setData({
                match: syntheticMatch,
                group: syntheticGroup,
                players: [],
                teamA: { team: { team_id: 'team-a', team_name: teamAName } } as unknown as TeamResponse,
                teamB: { team: { team_id: 'team-b', team_name: teamBName } } as unknown as TeamResponse,
            });
            setLoading(false);
            return;
        }
        try {
            const match = await getMatchDetails(matchId, controller.signal);
            if (controller.signal.aborted || !mountedRef.current) return;
            const [group, teamA, teamB] = await Promise.all([
                getGroupDetails(match.competition_id, match.category_id, match.group_id, controller.signal),
                getTeamProfile(match.team_A_id, controller.signal),
                getTeamProfile(match.team_B_id, controller.signal),
            ]);
            if (controller.signal.aborted || !mountedRef.current) return;
            setData({
                match,
                group,
                players: (match.lineups || []).map(p => lineupToStats(p, match, group)),
                teamA,
                teamB,
            });
        } catch (err: unknown) {
            if (controller.signal.aborted || !mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Ottelua ei voitu ladata. Yritä uudelleen.');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, data, fetchData };
}
