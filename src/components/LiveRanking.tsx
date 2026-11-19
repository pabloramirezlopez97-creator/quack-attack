import { useState } from "react";
import type { Player, Team } from "../types";

interface LiveRankingProps {
  players: Player[];
  // Solo en modo "Equipos de Exploradores": el ranking es por equipos.
  teams?: Team[];
  // Para resaltar tu fila (tu id de jugador; en equipos, se resalta tu equipo).
  myPlayerId?: string;
}

interface Entry {
  id: string;
  name: string;
  score: number;
  mine: boolean;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Ranking en tiempo real. Siempre se ven los 3 primeros con sus puntos;
 * el resto (4º en adelante) queda plegado y se despliega con un toque.
 */
export default function LiveRanking({ players, teams, myPlayerId }: LiveRankingProps) {
  const [open, setOpen] = useState(false);

  const exploradores = players.filter((p) => p.role === "explorador");
  const isTeamMode = !!teams && teams.length > 0;
  const myTeamId = players.find((p) => p.id === myPlayerId)?.team_id ?? null;

  const byScore = (a: Entry, b: Entry) => b.score - a.score || a.name.localeCompare(b.name);

  const ranked: Entry[] = isTeamMode
    ? teams!
        .map((t) => ({
          id: t.id,
          name: t.name,
          score: exploradores.filter((p) => p.team_id === t.id).reduce((s, p) => s + p.score, 0),
          mine: t.id === myTeamId,
        }))
        .sort(byScore)
    : exploradores
        .map((p) => ({ id: p.id, name: p.name, score: p.score, mine: p.id === myPlayerId }))
        .sort(byScore);

  if (ranked.length === 0) return null;

  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const row = (e: Entry, i: number) => (
    <div className={`ranking-row ${e.mine ? "mine" : ""}`} key={e.id}>
      <span className="ranking-pos">{i < 3 ? MEDALS[i] : `${i + 1}º`}</span>
      <span className="ranking-name">{e.name}</span>
      <span className="num">{e.score} pts</span>
    </div>
  );

  return (
    <div className="card live-ranking">
      <p className="muted" style={{ marginBottom: 6 }}>
        🏆 Ranking en directo{isTeamMode ? " · equipos" : ""}
      </p>
      {top.map((e, i) => row(e, i))}

      {rest.length > 0 && (
        <>
          <button
            className="ranking-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? "Ocultar ▲" : `Ver los demás (${rest.length}) ▼`}
          </button>
          {open && rest.map((e, i) => row(e, i + 3))}
        </>
      )}
    </div>
  );
}
