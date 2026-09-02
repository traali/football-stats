import React from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { formatDate, formatTime } from "../../utils/dates";
import { MATCH_STATUS } from "../../types";

export interface MatchWithVenue {
  match_id: string;
  date: string;
  time: string;
  team_A_id: string;
  team_B_id: string;
  team_A_name: string;
  team_B_name: string;
  fs_A: string;
  fs_B: string;
  winner_id: string;
  status: string;
  venue_name?: string;
  venue_location_name?: string;
  referee_1_name?: string;
  [key: string]: unknown;
}

export interface TournamentMatchesListProps {
  teamName: string;
  teamId?: string;
  matches: MatchWithVenue[];
  onSelectMatch?: (matchId: string) => void;
}

export const TournamentMatchesList: React.FC<TournamentMatchesListProps> = ({
  teamName,
  teamId,
  matches,
  onSelectMatch,
}) => {
  return (
    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
        <Calendar className="w-4 h-4 text-accent" />
        {teamName}:n ottelut ({matches.length})
      </h3>

      {matches.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-4">Ei otteluita</p>
      ) : (
        <div className="space-y-0 divide-y divide-border-hairline/50">
          {matches.map((m) => {
            const isHome = m.team_A_id === teamId;
            const opponent = isHome ? m.team_B_name : m.team_A_name;
            const myScore = isHome ? m.fs_A : m.fs_B;
            const oppScore = isHome ? m.fs_B : m.fs_A;
            const isFixture = m.status === MATCH_STATUS.FIXTURE || (!m.fs_A && !m.fs_B);

            return (
              <div
                key={m.match_id}
                onClick={() => onSelectMatch?.(m.match_id)}
                className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-all active:scale-[0.99] min-h-[52px]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-center shrink-0 w-14">
                    <p className="text-xs text-text-muted font-mono">{formatDate(m.date)}</p>
                    <p className="text-[10px] text-text-muted/60 font-mono">{formatTime(m.time)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-sm">
                      {isHome ? (
                        <>
                          <span className="text-accent font-semibold">{teamName}</span>
                          <span className="text-text-muted mx-1">vs</span>
                          <span className="text-text-primary truncate">{opponent}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-text-primary truncate">{opponent}</span>
                          <span className="text-text-muted mx-1">vs</span>
                          <span className="text-accent font-semibold">{teamName}</span>
                        </>
                      )}
                    </div>
                    {(m.venue_name || m.venue_location_name) && (
                      <p className="text-xs text-text-muted/70 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {m.venue_name}
                        {m.venue_location_name ? ` · ${m.venue_location_name}` : ""}
                      </p>
                    )}
                    {m.referee_1_name && (
                      <p className="text-[10px] text-text-muted/50 flex items-center gap-1 mt-0.5 truncate">
                        <Users className="w-2.5 h-2.5 shrink-0" />
                        Tuomari: {m.referee_1_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {isFixture ? (
                    <span className="text-text-muted font-mono text-sm font-bold min-w-[4ch] text-right">–</span>
                  ) : (
                    <span className="text-text-primary font-mono text-sm font-bold min-w-[4ch] text-right">
                      {myScore}–{oppScore}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
