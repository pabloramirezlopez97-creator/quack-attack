import { SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { Meeting } from "../types";

interface MeetingBannerProps {
  meeting: Meeting;
  isJefe: boolean;
  onClose: () => void;
  closing: boolean;
}

export default function MeetingBanner({ meeting, isJefe, onClose, closing }: MeetingBannerProps) {
  return (
    <div className="meeting-banner">
      <img
        src="/assets/branding/reunion icon.PNG"
        alt=""
        className="meeting-icon"
      />
      <p className="meeting-title">
        {SPECIAL_EMOJI[meeting.special_type]} ¡REUNIÓN EN EL ESTANQUE!
      </p>
      <p className="meeting-body">
        <strong>{meeting.player_name}</strong> ha activado el{" "}
        {SPECIAL_LABELS[meeting.special_type]} y convoca la Reunión en el
        Estanque. Acudid junto al Pato Jefe.
      </p>

      {meeting.hint_text && (
        <p className="meeting-body" style={{ color: "var(--yellow)" }}>
          🟠 Pista: "{meeting.hint_text}"
        </p>
      )}

      {isJefe ? (
        <button className="btn btn-primary" onClick={onClose} disabled={closing}>
          {closing ? "…" : "Cerrar Reunión en el Estanque"}
        </button>
      ) : (
        <p className="meeting-wait">Esperando a que el Pato Jefe cierre la Reunión en el Estanque…</p>
      )}
    </div>
  );
}
