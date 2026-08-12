import { ACTIVE_SPECIAL_TYPES, SPECIAL_COLORS, SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { SpecialDuck } from "../types";

interface SpecialDuckStripProps {
  specialDucks: SpecialDuck[];
  myPlayerId: string | undefined;
  onSelect: (duck: SpecialDuck) => void;
  onActivate: (duck: SpecialDuck) => void;
}

export default function SpecialDuckStrip({
  specialDucks,
  myPlayerId,
  onSelect,
  onActivate,
}: SpecialDuckStripProps) {
  const ordered = [...specialDucks].sort((a, b) => a.type.localeCompare(b.type));

  return (
    <div className="special-strip">
      {ordered.map((duck) => {
        const found = !!duck.owner_id;
        const isMine = found && duck.owner_id === myPlayerId;
        const canActivate =
          isMine && ACTIVE_SPECIAL_TYPES.includes(duck.type) && !duck.used;

        return (
          <div className="special-item" key={duck.id}>
            <button
              className={`special-tile ${found ? "found" : ""} ${isMine ? "mine" : ""}`}
              style={!found ? { backgroundColor: SPECIAL_COLORS[duck.type] } : undefined}
              disabled={found}
              onClick={() => onSelect(duck)}
              aria-label={SPECIAL_LABELS[duck.type]}
            >
              <span className="special-emoji">{SPECIAL_EMOJI[duck.type]}</span>
            </button>

            {canActivate && (
              <button
                className="megaphone-btn"
                onClick={() => onActivate(duck)}
                aria-label={`Activar ${SPECIAL_LABELS[duck.type]} y convocar Reunión en la Charca`}
              >
                📣
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
