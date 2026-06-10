import { useState, useCallback, useRef, useEffect } from 'react';
import { getMatchDetails, getGroupDetails, getPlayerData, getTeamData, batchFetch } from '../services/api';
import { processPlayerMatchHistory } from '../utils/dataProcessors';
import { APP_CONFIG } from '../types/config';
import { PlayerLineupInfo } from '../types/api';
import type { MatchDetails, GroupDetails, PlayerStats, TeamBasic } from '../types/api';

export function useMatchData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{
        match: MatchDetails;
        group: GroupDetails | null;
        players: PlayerStats[];
        teamA?: TeamBasic | null;
        teamB?: TeamBasic | null;
    } | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    const fetchData = useCallback(async (matchId: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setData(null);
        setLoading(true);
        setError(null);
        try {
            const match = await getMatchDetails(matchId);
            if (controller.signal.aborted || !mountedRef.current) return;

            const [group, teamA, teamB] = await Promise.all([
                getGroupDetails(match.competition_id, match.category_id, match.group_id),
                getTeamData(match.team_A_id),
                getTeamData(match.team_B_id),
            ]);
            if (controller.signal.aborted || !mountedRef.current) return;

            const playersInMatch: PlayerLineupInfo[] = match.lineups || [];
            const playerIds = playersInMatch.map(p => p.player_id);
            const playerDataList = await batchFetch(playerIds, getPlayerData, 5);
            if (controller.signal.aborted || !mountedRef.current) return;

            const processedPlayers: PlayerStats[] = []
            for (let idx = 0; idx < playersInMatch.length; idx++) {
                const lineupInfo = playersInMatch[idx];
                const playerData = playerDataList[idx];
                if (!playerData) continue;
                const processedHistory = processPlayerMatchHistory(
                    playerData.matches,
                    APP_CONFIG.CURRENT_YEAR,
                    APP_CONFIG.PREVIOUS_YEAR,
                    lineupInfo.team_name || (lineupInfo.team_id === match.team_A_id ? match.team_A_name : match.team_B_name)
                );
                processedPlayers.push({
                    name: lineupInfo.player_name,
                    shirtNumber: lineupInfo.shirt_number,
                    birthYear: playerData.birthyear,
                    img_url: playerData.img_url,
                    teamIdInMatch: lineupInfo.team_id,
                    ...processedHistory,
                    isCaptainInMatch: lineupInfo.captain === "1",
                    position_fi: lineupInfo.position_fi,
                    height: lineupInfo.height,
                    weight: lineupInfo.weight,
                });
            }

            setData({ match, group, players: processedPlayers, teamA, teamB });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Virhe ladattaessa tietoja');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, data, fetchData };
}
