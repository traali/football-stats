import { useState, useCallback, useRef, useEffect } from 'react';
import { getMatchDetails, getGroupDetails, getTeamProfile } from '../services/api';
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
            setError('Virheellinen ottelun tunnus');
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
