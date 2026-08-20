import { SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { MeetingInfo } from "../types";

interface MeetingBannerProps {
  meeting: MeetingInfo;
  isJefe: boolean;
  onClose: () => void;
  closing: boolean;
}

export default function MeetingBanner({ meeting, isJefe, onClose, closing }: MeetingBannerProps) {
  return (
    <div className="meeting-banner">
      <img
        src="/assets/branding/reunion_icon.jpg"
        alt=""
        className="meeting-icon"
      />
      <p className="meeting-title">
        {SPECIAL_EMOJI[meeting.special_type]} ¡REUNIÓN EN LA CHARCA!
      </p>
      <p className="meeting-body">
        <strong>{meeting.player_name}</strong> ha activado el{" "}
        {SPECIAL_LABELS[meeting.special_type]}. Reuníos junto al Pato Jefe.
      </p>

      {meeting.hint_text && (
        <p className="meeting-body" style={{ color: "var(--yellow)" }}>
          🟠 Pista: "{meeting.hint_text}"
        </p>
      )}

      {isJefe ? (
        <button className="btn btn-primary" onClick={onClose} disabled={closing}>
          {closing ? "…" : "Cerrar Reunión"}
        </button>
      ) : (
        <p className="meeting-wait">Esperando a que el Pato Jefe cierre la reunión…</p>
      )}
    </div>
  );
}
