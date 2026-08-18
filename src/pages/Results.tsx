import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Confetti from "../components/Confetti";
import type { Player } from "../types";

interface ResultsProps {
  gameCode: string;
  players: Player[];
}

const PODIUM_MEDALS = ["🥇", "🥈", "🥉"];

export default function Results({ gameCode, players }: ResultsProps) {
  const nav = useNavigate();
  const [stage, setStage] = useState(0); // 0 nada, 1 = 3º, 2 = 3º+2º, 3 = todos + confeti

  const ranked = players
    .filter((p) => p.role === "explorador")
    .slice()
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

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
            {podium.map((p, i) => {
              const visible = visibleIndexes.includes(i);
              return (
                <div
                  key={p.id}
                  className={`podium-slot podium-slot-${i} ${visible ? "visible" : ""}`}
                >
                  <span className="podium-medal">{PODIUM_MEDALS[i]}</span>
                  <span className="podium-name">{p.name}</span>
                  <span className="podium-score num">{p.score} pts</span>
                </div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && stage >= 3 && (
          <div className="card">
            {rest.map((p, i) => (
              <div className="player-row" key={p.id}>
                <span>🦆 {i + 4}º · {p.name}</span>
                <span className="num" style={{ marginLeft: "auto" }}>
                  {p.score} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {ranked.length === 0 && (
          <div className="card">
            <p className="muted">Sin Exploradores en esta partida.</p>
          </div>
        )}

        {(stage >= 3 || podium.length === 0) && (
          <button className="btn btn-primary" onClick={() => nav("/")}>
            🦆 Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}
