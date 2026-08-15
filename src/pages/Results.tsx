import { useNavigate } from "react-router-dom";
import type { Player } from "../types";

interface ResultsProps {
  gameCode: string;
  players: Player[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Results({ gameCode, players }: ResultsProps) {
  const nav = useNavigate();
  const ranked = players
    .filter((p) => p.role === "explorador")
    .slice()
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={() => nav("/")} aria-label="Salir">
          ←
        </button>
        <h2>Resultados</h2>
      </div>

      <div className="stack">
        <div className="card" style={{ textAlign: "center" }}>
          <p className="muted">Partida {gameCode} · ¡Terminada!</p>
        </div>

        <div className="card">
          {ranked.map((p, i) => (
            <div className="player-row" key={p.id}>
              <span>
                {MEDALS[i] ?? "🦆"} {p.name}
              </span>
              <span className="num" style={{ marginLeft: "auto" }}>
                {p.score} pts
              </span>
            </div>
          ))}
          {ranked.length === 0 && <p className="muted">Sin Exploradores en esta partida.</p>}
        </div>

        <button className="btn btn-primary" onClick={() => nav("/")}>
          🦆 Volver al inicio
        </button>
      </div>
    </div>
  );
}
