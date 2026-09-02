import React from "react";
import { TrendingUp } from "lucide-react";

export interface TournamentScorersListProps {
  title: string;
  scorers: Array<{
    player_id?: string;
    player_name?: string;
    name?: string;
    team_name?: string;
    goals?: number | string;
    assists?: string;
    goalsForThisSpecificTeamInSeason?: number;
  }>;
  onSelectPlayer?: (playerId: string) => void;
}

export const TournamentScorersList: React.FC<TournamentScorersListProps> = ({
  title,
  scorers,
  onSelectPlayer,
}) => {
  if (scorers.length === 0) return null;

  return (
    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent" />
        {title}
      </h3>
      <div className="space-y-1">
        {scorers.map((p, i) => {
          const playerName = p.player_name || p.name || "";
          const goals = p.goals ?? p.goalsForThisSpecificTeamInSeason ?? 0;
          return (
            <div
              key={p.player_id || i}
              onClick={() => p.player_id && onSelectPlayer?.(p.player_id)}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-2 border border-transparent hover:border-border-hairline cursor-pointer transition-all active:scale-[0.99] min-h-[44px]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-text-muted text-xs font-mono w-5 shrink-0">{i + 1}.</span>
                <span className="text-text-primary font-medium truncate text-sm">{playerName}</span>
                {p.team_name && (
                  <span className="text-text-muted text-xs truncate shrink-0">({p.team_name})</span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-accent font-bold font-mono text-sm">{goals} maalia</span>
                {p.assists && parseInt(p.assists) > 0 && (
                  <span className="text-text-muted text-xs font-mono">{p.assists} syöttöä</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
