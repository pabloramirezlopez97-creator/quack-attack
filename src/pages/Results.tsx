import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "../components/Confetti";
import LegalFooter from "../components/LegalFooter";
import type { Player, Team } from "../types";

interface ResultsProps {
  gameCode: string;
  players: Player[];
  // Solo en el modo "Equipos de exploradores" (mode 4): la lista de equipos de
  // esta partida. Si se pasa, el podio y el marcador se agrupan por equipo.
  teams?: Team[];
}

const PODIUM_MEDALS = ["🥇", "🥈", "🥉"];

// Una fila del ranking: puede ser un Explorador individual o un Equipo entero
// (con sus miembros ordenados dentro, para el desglose individual).
interface RankedEntry {
  id: string;
  name: string;
  score: number;
  members?: Player[];
}

export default function Results({ gameCode, players, teams }: ResultsProps) {
  const nav = useNavigate();
  const [stage, setStage] = useState(0); // 0 nada, 1 = 3º, 2 = 3º+2º, 3 = todos + confeti

  const exploradores = players.filter((p) => p.role === "explorador");
  const isTeamMode = !!teams && teams.length > 0;

  const ranked: RankedEntry[] = isTeamMode
    ? teams!
        .map((team) => {
          const miembros = exploradores
            .filter((p) => p.team_id === team.id)
            .slice()
            .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
          const total = miembros.reduce((sum, p) => sum + p.score, 0);
          return { id: team.id, name: team.name, score: total, members: miembros };
        })
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    : exploradores
        .slice()
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .map((p) => ({ id: p.id, name: p.name, score: p.score }));

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  useEffect(() => {
    if (podium.length === 0) return;
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [podium.length]);

  // Orden de aparición: 3º primero, luego 2º, luego 1º.
  const revealOrder = [2, 1, 0]; // índices dentro de `podium`
  const visibleCount = stage === 1 ? 1 : stage === 2 ? 2 : stage >= 3 ? 3 : 0;
  const visibleIndexes = revealOrder.slice(0, visibleCount);

  return (
    <div className="screen">
      {stage >= 3 && <Confetti />}

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

        {podium.length > 0 && (
          <div className="podium">
            {podium.map((entry, i) => {
              const visible = visibleIndexes.includes(i);
              return (
                <div
                  key={entry.id}
                  className={`podium-slot podium-slot-${i} ${visible ? "visible" : ""}`}
                >
                  <span className="podium-medal">{PODIUM_MEDALS[i]}</span>
                  <span className="podium-name">
                    {isTeamMode ? `🦆 ${entry.name}` : entry.name}
                  </span>
                  <span className="podium-score num">{entry.score} pts</span>
                  {isTeamMode && visible && entry.members && entry.members.length > 0 && (
                    <div className="podium-team-members">
                      {entry.members.map((m) => (
                        <span key={m.id} className="muted" style={{ display: "block" }}>
                          {m.name} · {m.score} pts
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && stage >= 3 && (
          <div className="card">
            {rest.map((entry, i) => (
              <div key={entry.id} style={{ marginBottom: isTeamMode ? 10 : 0 }}>
                <div className="player-row">
                  <span>🦆 {i + 4}º · {entry.name}</span>
                  <span className="num" style={{ marginLeft: "auto" }}>
                    {entry.score} pts
                  </span>
                </div>
                {isTeamMode &&
                  entry.members &&
                  entry.members.map((m) => (
                    <div
                      key={m.id}
                      className="muted"
                      style={{ display: "flex", justifyContent: "space-between", paddingLeft: 24 }}
                    >
                      <span>{m.name}</span>
                      <span className="num">{m.score} pts</span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        {ranked.length === 0 && (
          <div className="card">
            <p className="muted">
              {isTeamMode ? "Sin equipos en esta partida." : "Sin Exploradores en esta partida."}
            </p>
          </div>
        )}

        {(stage >= 3 || podium.length === 0) && (
          <button className="btn btn-primary" onClick={() => nav("/")}>
            🦆 Volver al inicio
          </button>
        )}

        {(stage >= 3 || podium.length === 0) && <LegalFooter />}
      </div>
    </div>
  );
}
