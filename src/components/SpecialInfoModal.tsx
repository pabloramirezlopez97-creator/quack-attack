import { SPECIAL_IMAGE, SPECIAL_INFO, SPECIAL_LABELS } from "../types";
import type { SpecialType } from "../types";

interface SpecialInfoModalProps {
  type: SpecialType;
  onClose: () => void;
}

/**
 * Ventana emergente con la habilidad de un Pato Especial, tal como aparece
 * en el Manual de Juego. Se usa tanto desde la pantalla del Explorador como
 * desde la del Jefe.
 */
export default function SpecialInfoModal({ type, onClose }: SpecialInfoModalProps) {
  const info = SPECIAL_INFO[type];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card info-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <div className="info-card-header">
          <img src={SPECIAL_IMAGE[type]} alt="" className="info-card-img" />
          <h3 style={{ margin: 0 }}>{SPECIAL_LABELS[type]}</h3>
          <p className="muted" style={{ margin: "4px 0 0" }}>{info.tipo}</p>
        </div>
        <div className="info-card-body">
          {info.parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
