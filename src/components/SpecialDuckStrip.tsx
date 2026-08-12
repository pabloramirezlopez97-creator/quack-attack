import { SPECIAL_COLORS, SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { SpecialDuck } from "../types";

interface SpecialDuckStripProps {
  specialDucks: SpecialDuck[];
  onSelect: (duck: SpecialDuck) => void;
}

export default function SpecialDuckStrip({ specialDucks, onSelect }: SpecialDuckStripProps) {
  const ordered = [...specialDucks].sort((a, b) => a.type.localeCompare(b.type));

  return (
    <div className="special-strip">
      {ordered.map((duck) => {
        const found = !!duck.owner_id;
        return (
          <button
            key={duck.id}
            className={`special-tile ${found ? "found" : ""}`}
            style={!found ? { backgroundColor: SPECIAL_COLORS[duck.type] } : undefined}
            disabled={found}
            onClick={() => onSelect(duck)}
            aria-label={SPECIAL_LABELS[duck.type]}
          >
            <span className="special-emoji">{SPECIAL_EMOJI[duck.type]}</span>
          </button>
        );
      })}
    </div>
  );
}
