import type { JoinRequest, Team } from "../types";

interface JoinRequestModalProps {
  requests: JoinRequest[]; // solicitudes pendientes, la más antigua primero
  teams: Team[];
  busy: boolean;
  error: string | null;
  onRespond: (requestId: string, accept: boolean) => void;
}

/**
 * Aviso para el Pato Jefe: alguien quiere unirse con la partida ya iniciada.
 * Muestra la solicitud más antigua; al responderla aparece la siguiente.
 */
export default function JoinRequestModal({
  requests,
  teams,
  busy,
  error,
  onRespond,
}: JoinRequestModalProps) {
  const current = requests[0];
  if (!current) return null;

  const team = current.team_id ? teams.find((t) => t.id === current.team_id) : null;
  const rol = current.role === "jefe" ? "Pato Jefe / Guardián" : "Pato Explorador";

  return (
    <div className="modal-backdrop">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>🦆 Solicitud para unirse</h3>
        <p style={{ marginTop: 10, fontSize: "1.05rem" }}>
          <strong>{current.name}</strong> quiere unirse a la partida
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          Como {rol}
          {team ? ` · ${team.name}` : ""}
        </p>
        {requests.length > 1 && (
          <p className="muted" style={{ marginTop: 6 }}>
            +{requests.length - 1} {requests.length - 1 === 1 ? "solicitud más" : "solicitudes más"} esperando
          </p>
        )}
        {error && <div className="alert" style={{ marginTop: 10 }}>{error}</div>}
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => onRespond(current.id, false)}
          >
            Rechazar
          </button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() => onRespond(current.id, true)}
          >
            {busy ? "…" : "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
}
