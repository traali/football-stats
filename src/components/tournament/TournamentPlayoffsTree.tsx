import React from "react";
import { Trophy, ChevronDown, ChevronRight, MapPin, Users } from "lucide-react";
import { cn } from "../../utils/cn";
import { formatDate, formatTime } from "../../utils/dates";
import type { MatchWithVenue } from "./TournamentMatchesList";

export interface PlayoffInfo {
  id: string;
  name: string;
  label: string;
  matches: MatchWithVenue[];
}

export interface TournamentPlayoffsTreeProps {
  playoffs: PlayoffInfo[];
  expandedPlayoff: string | null;
  onTogglePlayoff: (id: string) => void;
  groupName: string;
  onSelectMatch: (matchId: string) => void;
  renderPlayoffTeamName: (name: string) => React.ReactNode;
}

export const TournamentPlayoffsTree: React.FC<TournamentPlayoffsTreeProps> = ({
  playoffs,
  expandedPlayoff,
  onTogglePlayoff,
  groupName,
  onSelectMatch,
  renderPlayoffTeamName,
}) => {
  return (
    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" />
        Jatko-ottelut
      </h3>

      <div className="space-y-2">
        {playoffs.map((p) => (
          <div key={p.id} className="border border-border-hairline rounded-xl overflow-hidden">
            <button
              onClick={() => onTogglePlayoff(p.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors min-h-[48px] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full shrink-0",
                    p.matches.length > 0 ? "bg-accent" : "bg-text-muted"
                  )}
                />
                <span className="text-sm font-bold text-text-primary">{p.name}</span>
                {p.label && <span className="text-xs text-text-muted">{p.label}</span>}
              </div>
              {expandedPlayoff === p.id ? (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
            </button>

            {expandedPlayoff === p.id && (
              <div className="border-t border-border-hairline">
                {p.matches.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-4">Ei otteluita</p>
                ) : (
                  <div className="divide-y divide-border-hairline/50">
                    {[...p.matches]
                      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                      .map((m) => (
                        <div
                          key={m.match_id}
                          onClick={() => onSelectMatch(m.match_id)}
                          className="flex items-center justify-between py-2.5 px-4 hover:bg-surface-2 cursor-pointer transition-all min-h-[44px]"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="text-center shrink-0 w-14">
                              <p className="text-xs text-text-muted font-mono">{formatDate(m.date)}</p>
                              <p className="text-[11px] text-text-muted/70 font-mono">{formatTime(m.time)}</p>
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs font-mono truncate">
                                {renderPlayoffTeamName(m.team_A_name || "—")}
                              </p>
                              <p className="text-[10px] text-text-muted/40 text-center leading-none">vs</p>
                              <p className="text-xs font-mono truncate">
                                {renderPlayoffTeamName(m.team_B_name || "—")}
                              </p>
                              {(m.venue_name || m.venue_location_name) && (
                                <p className="text-xs text-text-muted/70 flex items-center gap-1 mt-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  {m.venue_name}
                                  {m.venue_location_name ? ` · ${m.venue_location_name}` : ""}
                                </p>
                              )}
                              {m.referee_1_name && (
                                <p className="text-[10px] text-text-muted/50 flex items-center gap-1 mt-0.5 truncate">
                                  <Users className="w-2.5 h-2.5 shrink-0" />
                                  {m.referee_1_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {playoffs.filter((p) => p.matches.length > 0).length > 0 && (
        <p className="text-xs text-text-muted/60 pt-1">
          Esim. {groupName}/I = {groupName}-lohkon 1. sija · Roomalaiset numerot viittaavat lohkon sijoitukseen
        </p>
      )}
    </div>
  );
};
