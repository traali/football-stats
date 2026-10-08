import { useState, useCallback, useRef, useEffect } from 'react';
import { getMatchDetails, getGroupDetails, getTeamProfile } from '../services/api';
import type { MatchDetails, GroupDetails, TeamResponse } from '../types';
import { friendlyError } from '../utils/friendlyError';

export function nonNumericMatchRefusal(matchId: string): string | null {
    let raw: string;
    try {
        raw = decodeURIComponent(matchId);
    } catch {
        raw = matchId;
    }
    if (/^\d+$/.test(raw.trim())) return null;
    return 'Anna ottelun numero. Nimestä ei näytetä tulosta eikä taulukkoa.';
}

export function useMatchData() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{
        match: MatchDetails;
        group: GroupDetails | null;
        teamA?: TeamResponse | null;
        teamB?: TeamResponse | null;
    } | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => { mountedRef.current = false; abortRef.current?.abort(); };
    }, []);

    const fetchData = useCallback(async (matchId: string, opts?: { silent?: boolean }) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        if (!opts?.silent) {
            setData(null);
            setLoading(true);
        }
        setError(null);
        const refusal = nonNumericMatchRefusal(matchId);
        if (refusal) {
            setError(refusal);
            setData(null);
            setLoading(false);
            return;
        }
        const id = decodeURIComponent(matchId).trim();
        try {
            const match = await getMatchDetails(id, controller.signal);
            if (controller.signal.aborted || !mountedRef.current) return;
            // Crests and table are extras: a failure there must not hide the match itself.
            const [group, teamA, teamB] = await Promise.all([
                getGroupDetails(match.competition_id, match.category_id, match.group_id, controller.signal).catch(() => null),
                match.team_A_id ? getTeamProfile(match.team_A_id, controller.signal).catch(() => null) : Promise.resolve(null),
                match.team_B_id ? getTeamProfile(match.team_B_id, controller.signal).catch(() => null) : Promise.resolve(null),
            ]);
            if (controller.signal.aborted || !mountedRef.current) return;
            setData({ match, group, teamA, teamB });
        } catch (err: unknown) {
            if (controller.signal.aborted || !mountedRef.current) return;
            if (opts?.silent) return; // keep showing the last good data during live refresh
            setError(friendlyError(err, 'Ottelua'));
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, data, fetchData };
}
