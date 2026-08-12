import { useNavigate } from "react-router-dom";
import { SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { Duck, Game, Player, SpecialDuck } from "../types";

const STATUS_LABEL: Record<string, string> = {
  lobby: "Sala de espera",
  preparacion: "Preparación",
  en_curso: "Búsqueda en curso",
  reunion: "Reunión en la Charca",
  finalizacion: "Finalizando",
  recuento: "Recuento",
  resultados: "Resultados",
};

interface JefePanelProps {
  game: Game;
  players: Player[];
  ducks: Duck[];
  specialDucks: SpecialDuck[];
}

export default function JefePanel({ game, players, ducks, specialDucks }: JefePanelProps) {
  const nav = useNavigate();
  const foundCount = ducks.filter((d) => d.owner_id).length;
  const specialFoundCount = specialDucks.filter((d) => d.owner_id).length;
  const allFound =
    ducks.length > 0 &&
    foundCount === ducks.length &&
    specialDucks.length > 0 &&
    specialFoundCount === specialDucks.length;

  const exploradores = players.filter((p) => p.role === "explorador");
  const ownerName = (id: string | null) => players.find((p) => p.id === id)?.name ?? null;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={() => nav("/")} aria-label="Salir de la partida">
          ←
        </button>
        <h2>Partida {game.code}</h2>
      </div>

      <div className="stack">
        <div className="card">
          <p className="muted" style={{ marginBottom: 4 }}>
            Estado: <strong style={{ color: "var(--white)" }}>{STATUS_LABEL[game.status]}</strong>
          </p>
          <p className="muted">
            Patos Normales: <strong className="num">{foundCount} / 100</strong>
            {"  ·  "}
            Especiales: <strong className="num">{specialFoundCount} / {specialDucks.length}</strong>
          </p>
        </div>

        {allFound && (
          <div className="card" style={{ borderColor: "var(--yellow)" }}>
            <p style={{ color: "var(--yellow)", fontWeight: 700 }}>
              🎉 ¡Los 100 Patos Normales y los 8 Especiales han sido encontrados!
            </p>
          </div>
        )}

        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>
            Patos Exploradores ({exploradores.length})
          </p>
          {exploradores.length === 0 && <p className="muted">Nadie se ha unido todavía.</p>}
          {exploradores.map((p) => (
            <div className="player-row" key={p.id}>
              <span>🦆 {p.name}</span>
              <span className="num">{p.score} pts</span>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>
            Patos Especiales
          </p>
          {specialDucks
            .slice()
            .sort((a, b) => a.type.localeCompare(b.type))
            .map((s) => (
              <div className="player-row" key={s.id}>
                <span>
                  {SPECIAL_EMOJI[s.type]} {SPECIAL_LABELS[s.type]}
                </span>
                <span className="muted" style={{ marginLeft: "auto" }}>
                  {s.owner_id ? `Encontrado · ${ownerName(s.owner_id)}` : "Escondido"}
                </span>
              </div>
            ))}
        </div>

        <div className="card">
          <p className="muted">
            Las habilidades de cada Especial (Negro, Verde, Marrón, Naranja,
            Azul) y el botón de finalizar partida llegan en la siguiente
            fase. Por ahora, aquí supervisas todo en vivo y cierras las
            Reuniones en la Charca.
          </p>
        </div>
      </div>
    </div>
  );
}
