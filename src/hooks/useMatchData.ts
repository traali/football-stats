import { useState, useCallback } from 'react';
import { getMatchDetails, getGroupDetails, getPlayerData } from '../services/api';
import { processPlayerMatchHistory } from '../utils/dataProcessors';
import { APP_CONFIG } from '../types/config';
import { MatchDetails, GroupDetails, PlayerStats } from '../types/api';

export function useMatchData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{
        match: MatchDetails;
        group: GroupDetails | null;
        players: PlayerStats[];
    } | null>(null);

    const fetchData = useCallback(async (matchId: string) => {
        setLoading(true);
        setError(null);
        try {
            const match = await getMatchDetails(matchId);

            const group = await getGroupDetails(match.competition_id, match.category_id, match.group_id);

            const playersInMatch = match.lineups || [];
            const playerPromises = playersInMatch.map(async (lineupInfo: any) => {
                const playerData = await getPlayerData(lineupInfo.player_id);
                const processedHistory = processPlayerMatchHistory(
                    playerData.matches,
                    APP_CONFIG.CURRENT_YEAR,
                    APP_CONFIG.PREVIOUS_YEAR,
                    lineupInfo.team_name || (lineupInfo.team_id === match.team_A_id ? match.team_A_name : match.team_B_name)
                );

                return {
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
                } as PlayerStats;
            });

            const processedPlayers = await Promise.all(playerPromises);

            setData({
                match,
                group,
                players: processedPlayers
            });
        } catch (err: any) {
            setError(err.message || 'Virhe ladattaessa tietoja');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, data, fetchData };
}
