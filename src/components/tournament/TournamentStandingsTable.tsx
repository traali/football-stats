import React from "react";
import { Trophy } from "lucide-react";
import type { StandingTeam } from "../../types";
import { cn } from "../../utils/cn";

export interface TournamentStandingsTableProps {
  groupName: string;
  standings: StandingTeam[];
  teamId?: string;
  onSelectTeam?: (teamId: string) => void;
}

export const TournamentStandingsTable: React.FC<TournamentStandingsTableProps> = ({
  groupName,
  standings,
  teamId,
  onSelectTeam,
}) => {
  return (
    <div className="bg-surface-1 border border-border-hairline rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" />
        Sarjataulukko · {groupName}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-hairline">
              <th className="text-left py-2 pr-2 font-semibold w-8">#</th>
              <th className="text-left py-2 pr-2 font-semibold">Joukkue</th>
              <th className="text-center py-2 px-1.5 font-semibold">O</th>
              <th className="text-center py-2 px-1.5 font-semibold">V</th>
              <th className="text-center py-2 px-1.5 font-semibold">T</th>
              <th className="text-center py-2 px-1.5 font-semibold">H</th>
              <th className="text-center py-2 px-1.5 font-semibold">TM</th>
              <th className="text-center py-2 px-1.5 font-semibold">PM</th>
              <th className="text-center py-2 px-1.5 font-semibold">ME</th>
              <th className="text-center py-2 pl-1.5 font-semibold">P</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => {
              const isSelected = String(s.team_id) === teamId;
              return (
                <tr
                  key={s.team_id}
                  onClick={() => !isSelected && onSelectTeam?.(String(s.team_id))}
                  className={cn(
                    "border-b border-border-hairline/50 transition-colors",
                    isSelected ? "bg-accent/5" : "hover:bg-surface-2 cursor-pointer"
                  )}
                >
                  <td className="py-2.5 pr-2 font-mono text-text-muted text-xs">{s.current_standing}</td>
                  <td className={cn("py-2.5 pr-2 font-semibold text-text-primary text-sm", isSelected && "text-accent")}>
                    {s.team_name}
                  </td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.matches_played}</td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-semantic-green text-xs">{s.matches_won}</td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-accent text-xs">{s.matches_tied}</td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-semantic-red text-xs">{s.matches_lost}</td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.goals_for}</td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.goals_against}</td>
                  <td className="text-center py-2.5 px-1.5 font-mono text-text-secondary text-xs">{s.goals_diff}</td>
                  <td className="text-center py-2.5 pl-1.5 font-mono font-bold text-accent">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
