import { useEffect, useRef, useState } from "react";
import type { Duck, Player } from "../types";

interface DuckGridProps {
  ducks: Duck[];
  myPlayerId: string | undefined;
  onSelect: (duck: Duck) => void;
}

// Un color de acento distinto por cada decena, como en la imagen de referencia.
const DECADE_COLORS = [
  "#4a90d9", // 01-10 azul
  "#4bbf7a", // 11-20 verde
  "#f5c518", // 21-30 amarillo
  "#f5a623", // 31-40 naranja
  "#e15b5b", // 41-50 rojo
  "#b06ad9", // 51-60 morado
  "#4ad9c9", // 61-70 turquesa
  "#d94a8c", // 71-80 rosa
  "#8bd94a", // 81-90 lima
  "#d9b34a", // 91-100 dorado
];

export default function DuckGrid({ ducks, myPlayerId, onSelect }: DuckGridProps) {
  const byNumber = [...ducks].sort((a, b) => a.number - b.number);
  const decades: Duck[][] = [];
  for (let i = 0; i < 10; i++) {
    decades.push(byNumber.slice(i * 10, i * 10 + 10));
  }

  return (
    <div className="duck-grid-wrap">
      {decades.map((group, i) => {
        if (group.length === 0) return null;
        const from = group[0].number;
        const to = group[group.length - 1].number;
        const color = DECADE_COLORS[i % DECADE_COLORS.length];

        return (
          <div className="decade-block" key={i}>
            <div className="decade-divider" style={{ color }}>
              <span>
                {String(from).padStart(2, "0")}–{String(to).padStart(2, "0")}
              </span>
            </div>
            <div className="duck-grid">
              {group.map((duck) => (
                <DuckTile
                  key={duck.id}
                  duck={duck}
                  myPlayerId={myPlayerId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DuckTile({
  duck,
  myPlayerId,
  onSelect,
}: {
  duck: Duck;
  myPlayerId: string | undefined;
  onSelect: (duck: Duck) => void;
}) {
  const isMine = !!duck.owner_id && duck.owner_id === myPlayerId;
  const isTaken = !!duck.owner_id && !isMine;

  const [popping, setPopping] = useState(false);
  const wasMineRef = useRef(isMine);

  useEffect(() => {
    if (isMine && !wasMineRef.current) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 350);
      return () => clearTimeout(t);
    }
    wasMineRef.current = isMine;
  }, [isMine]);

  return (
    <button
      className={`duck-tile ${isMine ? "mine" : ""} ${isTaken ? "taken" : ""} ${popping ? "pop" : ""}`}
      disabled={isTaken}
      onClick={() => onSelect(duck)}
    >
      {String(duck.number).padStart(2, "0")}
    </button>
  );
}

export function ownerName(duck: Duck, players: Player[]): string | null {
  if (!duck.owner_id) return null;
  return players.find((p) => p.id === duck.owner_id)?.name ?? null;
}
