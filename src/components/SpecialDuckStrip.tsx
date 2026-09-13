import { useEffect, useRef, useState } from "react";
import { ACTIVE_SPECIAL_TYPES, SPECIAL_LABELS } from "../types";
import type { SpecialDuck, SpecialType } from "../types";
import SpecialInfoModal from "./SpecialInfoModal";

interface SpecialDuckStripProps {
  specialDucks: SpecialDuck[];
  myPlayerId: string | undefined;
  blocked: boolean;
  onSelect: (duck: SpecialDuck) => void;
  onActivate: (duck: SpecialDuck) => void;
}

export default function SpecialDuckStrip({
  specialDucks,
  myPlayerId,
  blocked,
  onSelect,
  onActivate,
}: SpecialDuckStripProps) {
  const ordered = [...specialDucks].sort((a, b) => a.type.localeCompare(b.type));
  const [infoType, setInfoType] = useState<SpecialType | null>(null);

  return (
    <>
      <div className="special-strip">
        {ordered.map((duck) => (
          <SpecialTile
            key={duck.id}
            duck={duck}
            myPlayerId={myPlayerId}
            blocked={blocked}
            onSelect={onSelect}
            onActivate={onActivate}
            onInfo={() => setInfoType(duck.type)}
          />
        ))}
      </div>
      {infoType && <SpecialInfoModal type={infoType} onClose={() => setInfoType(null)} />}
    </>
  );
}

function SpecialTile({
  duck,
  myPlayerId,
  blocked,
  onSelect,
  onActivate,
  onInfo,
}: {
  duck: SpecialDuck;
  myPlayerId: string | undefined;
  blocked: boolean;
  onSelect: (duck: SpecialDuck) => void;
  onActivate: (duck: SpecialDuck) => void;
  onInfo: () => void;
}) {
  const found = !!duck.owner_id;
  const used = duck.status === "discarded";
  const isMine = found && duck.owner_id === myPlayerId;
  const canActivate = isMine && ACTIVE_SPECIAL_TYPES.includes(duck.type) && !duck.used;
  const stateClass = used ? "used" : found ? "found-held" : "unfound";

  const [popping, setPopping] = useState(false);
  const wasFoundRef = useRef(found);

  useEffect(() => {
    if (found && !wasFoundRef.current) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 350);
      return () => clearTimeout(t);
    }
    wasFoundRef.current = found;
  }, [found]);

  return (
    <div className="special-item">
      <button
        className="info-icon-btn"
        onClick={onInfo}
        aria-label={`Ver la habilidad de ${SPECIAL_LABELS[duck.type]}`}
      >
        i
      </button>

      <button
        className={`special-tile ${stateClass} ${isMine ? "mine" : ""} ${popping ? "pop" : ""}`}
        disabled={found}
        onClick={() => onSelect(duck)}
        aria-label={SPECIAL_LABELS[duck.type]}
      >
        <img
          src={`/assets/ducks/pato ${duck.type}.png`}
          alt=""
          className="special-duck-img"
        />
      </button>

      {canActivate ? (
        blocked ? (
          <div className="megaphone-btn" aria-label="Espera a que el Jefe cierre la Reunión en el Estanque">
            <img src="/assets/branding/megafono bloqueado.png" alt="" className="megaphone-img" />
          </div>
        ) : (
          <button
            className="megaphone-btn"
            onClick={() => onActivate(duck)}
            aria-label={`Activar ${SPECIAL_LABELS[duck.type]} y convocar la Reunión en el Estanque`}
          >
            <img src="/assets/branding/megafono activo.png" alt="" className="megaphone-img" />
          </button>
        )
      ) : (
        <div className="megaphone-btn megaphone-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}
