import type { Duck, Player } from "../types";

interface DuckGridProps {
  ducks: Duck[];
  myPlayerId: string | undefined;
  onSelect: (duck: Duck) => void;
}

export default function DuckGrid({ ducks, myPlayerId, onSelect }: DuckGridProps) {
  const byNumber = [...ducks].sort((a, b) => a.number - b.number);

  return (
    <div className="duck-grid">
      {byNumber.map((duck) => {
        const isMine = !!duck.owner_id && duck.owner_id === myPlayerId;
        const isTaken = !!duck.owner_id && !isMine;
        return (
          <button
            key={duck.id}
            className={`duck-tile ${isMine ? "mine" : ""} ${isTaken ? "taken" : ""}`}
            disabled={isTaken}
            onClick={() => onSelect(duck)}
          >
            {String(duck.number).padStart(2, "0")}
          </button>
        );
      })}
    </div>
  );
}

export function ownerName(duck: Duck, players: Player[]): string | null {
  if (!duck.owner_id) return null;
  return players.find((p) => p.id === duck.owner_id)?.name ?? null;
}
