import { useState, useCallback, useRef, useEffect } from 'react';
import { getMatchDetails, getGroupDetails, getTeamProfile } from '../services/api';
import type { MatchDetails, GroupDetails, PlayerStats, TeamResponse, PlayerLineupInfo } from '../types';

function lineupToStats(lineupInfo: PlayerLineupInfo): PlayerStats {
    return {
        playerId: lineupInfo.player_id,
        name: lineupInfo.player_name,
        shirtNumber: lineupInfo.shirt_number,
        birthYear: '',
        img_url: undefined,
        teamIdInMatch: lineupInfo.team_id,
        gamesPlayedThisYear: 0,
        goalsThisYear: 0,
        warningsThisYear: 0,
        suspensionsThisYear: 0,
        goalsByTeamThisYear: {},
        warningsByTeamThisYear: {},
        gamesByTeamThisYear: {},
        goalsForThisSpecificTeamInSeason: 0,
        gamesPlayedLastSeason: 0,
        goalsScoredLastSeason: 0,
        teamsThisYear: '',
        isCaptainInMatch: lineupInfo.captain === '1',
        position_fi: lineupInfo.position_fi,
        height: lineupInfo.height,
        weight: lineupInfo.weight,
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
            setData({ match, group, players: (match.lineups || []).map(lineupToStats), teamA, teamB });
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
