import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { Duck, Game, MeetingInfo, Player, SpecialDuck } from "../types";
import MeetingResolutionPanel from "./MeetingResolutionPanel";
import SoundToggle from "./SoundToggle";

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
  myPlayerId: string | undefined;
}

export default function JefePanel({ game, players, ducks, specialDucks, myPlayerId }: JefePanelProps) {
  const nav = useNavigate();
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [closingMeeting, setClosingMeeting] = useState(false);

  const foundCount = ducks.filter((d) => d.owner_id).length;
  const specialFoundCount = specialDucks.filter((d) => d.owner_id).length;
  const allFound =
    ducks.length > 0 &&
    foundCount === ducks.length &&
    specialDucks.length > 0 &&
    specialFoundCount === specialDucks.length;

  const exploradores = players.filter((p) => p.role === "explorador");
  const ownerName = (id: string | null) => players.find((p) => p.id === id)?.name ?? null;
  const meeting = game.current_meeting as unknown as MeetingInfo | null;

  const pendingActive = specialDucks.filter(
    (s) =>
      ["negro", "verde", "marron", "naranja", "azul"].includes(s.type) &&
      !s.ever_activated &&
      s.owner_id
  );

  async function handleCloseMeeting() {
    setClosingMeeting(true);
    await supabase.rpc("close_meeting", { p_code: game.code });
    setClosingMeeting(false);
  }

  async function handleFinalize() {
    setFinishing(true);
    setFinishError(null);
    const { error } = await supabase.rpc("finalize_game", { p_code: game.code });
    setFinishing(false);
    if (error) {
      setFinishError(error.message);
      return;
    }
    setConfirmingFinish(false);
  }

  return (
    <div className="screen">
      <SoundToggle />
      <div className="topbar">
        <button className="back-btn" onClick={() => nav("/")} aria-label="Salir de la partida">
          ←
        </button>
        <h2>Partida {game.code}</h2>
      </div>

      <div className="stack">
        {meeting && (
          <MeetingResolutionPanel
            meeting={meeting}
            players={players}
            specialDucks={specialDucks}
            ducks={ducks}
            myPlayerId={myPlayerId}
            isJefe={true}
            onClose={handleCloseMeeting}
            closing={closingMeeting}
          />
        )}

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
              <img src="/assets/ducks/pato_explorador.png" alt="" className="role-icon" />
              <span>{p.name}</span>
              <span className="num" style={{ marginLeft: "auto" }}>{p.score} pts</span>
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

        <button className="btn btn-primary" onClick={() => setConfirmingFinish(true)}>
          🏁 Finalizar partida
        </button>
      </div>

      {confirmingFinish && (
        <div className="modal-backdrop" onClick={() => !finishing && setConfirmingFinish(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>¿Finalizar la partida?</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Se aplicará el Dorado (+5) y el Rojo (−5) a quien los tenga, y
              −8 por cada Especial Activo que nadie llegó a activar.
            </p>
            {pendingActive.length > 0 && (
              <div className="alert" style={{ marginTop: 12, textAlign: "left" }}>
                Sin activar todavía:{" "}
                {pendingActive.map((s) => SPECIAL_LABELS[s.type]).join(", ")}. Si
                todavía hay oportunidad real de usarlos, cancela y espera
                ("Última oportunidad").
              </div>
            )}
            {finishError && <div className="alert" style={{ marginTop: 12 }}>{finishError}</div>}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmingFinish(false)}
                disabled={finishing}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleFinalize} disabled={finishing}>
                {finishing ? "…" : "🏁 Sí, finalizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
