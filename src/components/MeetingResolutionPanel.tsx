import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { MeetingInfo, Player, SpecialDuck } from "../types";

interface Props {
  meeting: MeetingInfo;
  players: Player[];
  specialDucks: SpecialDuck[];
  myPlayerId: string | undefined;
}

export default function MeetingResolutionPanel({ meeting, players, specialDucks, myPlayerId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetId, setTargetId] = useState("");
  const [negroChoice, setNegroChoice] = useState<"dorado" | "normal">("dorado");
  const [hintText, setHintText] = useState("");
  const [verdeOp, setVerdeOp] = useState<"comprar" | "vender">("comprar");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [tradedSpecialId, setTradedSpecialId] = useState("");
  const [azulSpecialAId, setAzulSpecialAId] = useState("");
  const [azulMode, setAzulMode] = useState<"mover" | "intercambiar">("mover");
  const [azulToAId, setAzulToAId] = useState("");
  const [azulSpecialBId, setAzulSpecialBId] = useState("");
  const [azulToBId, setAzulToBId] = useState("");
  const [azulNewOwnerId, setAzulNewOwnerId] = useState("");

  const digit = useMemo(() => Math.floor(Math.random() * 10), [meeting.special_id]);

  useEffect(() => {
    setError(null);
    setTargetId("");
    setNegroChoice("dorado");
    setHintText("");
    setVerdeOp("comprar");
    setCounterpartyId("");
    setTradedSpecialId("");
    setAzulSpecialAId("");
    setAzulMode("mover");
    setAzulToAId("");
    setAzulSpecialBId("");
    setAzulToBId("");
    setAzulNewOwnerId("");
  }, [meeting.special_id]);

  const nameOf = (id: string | null | undefined) => players.find((p) => p.id === id)?.name ?? "?";
  const explorers = players.filter((p) => p.role === "explorador");
  const otherExplorers = explorers.filter((p) => p.id !== meeting.player_id);

  async function run(call: () => ReturnType<typeof supabase.rpc>) {
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await call();
    setSubmitting(false);
    if (rpcError) setError(rpcError.message);
  }

  // ---------- Ya resuelto: solo mostrar el resultado ----------
  if (meeting.resolution && !meeting.pending_blanco) {
    return (
      <div className="card" style={{ borderColor: "var(--success)" }}>
        <p style={{ color: "var(--success)", fontWeight: 700, marginBottom: 6 }}>
          ✅ {meeting.resolution}
        </p>
        {meeting.hint_text && (
          <p className="muted">Pista: “{meeting.hint_text}”</p>
        )}
        <p className="muted" style={{ marginTop: 6 }}>
          El Pato Jefe cerrará la Reunión cuando corresponda.
        </p>
      </div>
    );
  }

  // ---------- Defensa pendiente del Pato Blanco ----------
  if (meeting.pending_blanco) {
    const pb = meeting.pending_blanco;
    if (myPlayerId !== pb.target_player_id) {
      return (
        <div className="card">
          <p className="muted">
            ⚪ Esperando a que <strong style={{ color: "var(--white)" }}>{pb.target_player_name}</strong>{" "}
            decida si usa el Pato Blanco para defenderse…
          </p>
        </div>
      );
    }
    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 12 }}>
          ⚫ Te están atacando con el Pato Negro. Tienes el Pato Blanco ⚪ — ¿lo usas para bloquear?
        </p>
        {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            disabled={submitting}
            onClick={() =>
              run(() =>
                supabase.rpc("resolve_blanco_defense", {
                  p_special_id_blanco: pb.blanco_special_id,
                  p_use_blanco: false,
                })
              )
            }
          >
            No bloquear
          </button>
          <button
            className="btn btn-primary"
            disabled={submitting}
            onClick={() =>
              run(() =>
                supabase.rpc("resolve_blanco_defense", {
                  p_special_id_blanco: pb.blanco_special_id,
                  p_use_blanco: true,
                })
              )
            }
          >
            {submitting ? "…" : "⚪ Bloquear"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- No soy quien lo activó: esperar ----------
  if (myPlayerId !== meeting.player_id) {
    return (
      <div className="card">
        <p className="muted">
          Esperando a que <strong style={{ color: "var(--white)" }}>{meeting.player_name}</strong>{" "}
          resuelva el {SPECIAL_LABELS[meeting.special_type]}…
        </p>
      </div>
    );
  }

  // ---------- MARRÓN ----------
  if (meeting.special_type === "marron") {
    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>🟤 Elige a quién bloquear 30 segundos:</p>
        <div className="stack" style={{ marginBottom: 12 }}>
          {otherExplorers.map((p) => (
            <button
              key={p.id}
              className={`role-card ${targetId === p.id ? "selected" : ""}`}
              onClick={() => setTargetId(p.id)}
            >
              <strong>{p.name}</strong>
            </button>
          ))}
        </div>
        {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
        <button
          className="btn btn-primary"
          disabled={!targetId || submitting}
          onClick={() =>
            run(() =>
              supabase.rpc("resolve_marron", {
                p_special_id: meeting.special_id,
                p_target_player_id: targetId,
              })
            )
          }
        >
          {submitting ? "…" : "🟤 Bloquear"}
        </button>
      </div>
    );
  }

  // ---------- NARANJA ----------
  if (meeting.special_type === "naranja") {
    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>
          🟠 Escribe una pista para encontrar UN Pato Normal (nunca puede señalar un Especial):
        </p>
        <div className="field" style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Ej: Está cerca de algo azul…"
            value={hintText}
            onChange={(e) => setHintText(e.target.value)}
          />
        </div>
        {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
        <button
          className="btn btn-primary"
          disabled={!hintText.trim() || submitting}
          onClick={() =>
            run(() => supabase.rpc("resolve_naranja", { p_special_id: meeting.special_id, p_hint_text: hintText.trim() }))
          }
        >
          {submitting ? "…" : "🟠 Enviar pista"}
        </button>
      </div>
    );
  }

  // ---------- NEGRO ----------
  if (meeting.special_type === "negro") {
    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>⚫ Elige el objetivo:</p>
        <div className="stack" style={{ marginBottom: 14 }}>
          {otherExplorers.map((p) => (
            <button
              key={p.id}
              className={`role-card ${targetId === p.id ? "selected" : ""}`}
              onClick={() => setTargetId(p.id)}
            >
              <strong>{p.name}</strong>
            </button>
          ))}
        </div>

        <p className="muted" style={{ marginBottom: 10 }}>¿Qué roba?</p>
        <div className="stack" style={{ marginBottom: 14 }}>
          <button
            className={`role-card ${negroChoice === "dorado" ? "selected" : ""}`}
            onClick={() => setNegroChoice("dorado")}
          >
            <strong>🟡 Robar el Dorado</strong>
          </button>
          <button
            className={`role-card ${negroChoice === "normal" ? "selected" : ""}`}
            onClick={() => setNegroChoice("normal")}
          >
            <div>
              <strong>Robar Patos Normales</strong>
              <small>Cifra sorteada: {digit}</small>
            </div>
          </button>
        </div>

        {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
        <button
          className="btn btn-primary"
          disabled={!targetId || submitting}
          onClick={() =>
            run(() =>
              supabase.rpc("negro_attack", {
                p_special_id: meeting.special_id,
                p_choice: negroChoice,
                p_target_player_id: targetId,
                p_digit: negroChoice === "normal" ? digit : null,
              })
            )
          }
        >
          {submitting ? "…" : "⚫ Atacar"}
        </button>
      </div>
    );
  }

  // ---------- VERDE ----------
  if (meeting.special_type === "verde") {
    const counterpartySpecials = specialDucks.filter(
      (s) => s.status === "held" && s.owner_id === counterpartyId
    );
    const ownSpecials = specialDucks.filter(
      (s) => s.status === "held" && s.owner_id === myPlayerId
    );
    const availableSpecials = verdeOp === "comprar" ? counterpartySpecials : ownSpecials;

    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>🟢 ¿Comprar o vender?</p>
        <div className="stack" style={{ marginBottom: 14 }}>
          <button
            className={`role-card ${verdeOp === "comprar" ? "selected" : ""}`}
            onClick={() => { setVerdeOp("comprar"); setTradedSpecialId(""); }}
          >
            <strong>Comprar (pagas 3 Normales propios)</strong>
          </button>
          <button
            className={`role-card ${verdeOp === "vender" ? "selected" : ""}`}
            onClick={() => { setVerdeOp("vender"); setTradedSpecialId(""); }}
          >
            <strong>Vender (recibes 2 Normales)</strong>
          </button>
        </div>

        <p className="muted" style={{ marginBottom: 10 }}>Con qué jugador:</p>
        <div className="stack" style={{ marginBottom: 14 }}>
          {otherExplorers.map((p) => (
            <button
              key={p.id}
              className={`role-card ${counterpartyId === p.id ? "selected" : ""}`}
              onClick={() => { setCounterpartyId(p.id); setTradedSpecialId(""); }}
            >
              <strong>{p.name}</strong>
            </button>
          ))}
        </div>

        {counterpartyId && (
          <>
            <p className="muted" style={{ marginBottom: 10 }}>
              {verdeOp === "comprar" ? "Qué Especial le compras:" : "Qué Especial propio vendes:"}
            </p>
            {availableSpecials.length === 0 && (
              <p className="muted" style={{ marginBottom: 14 }}>
                {verdeOp === "comprar" ? "Ese jugador no tiene Especiales." : "No tienes otros Especiales."}
              </p>
            )}
            <div className="stack" style={{ marginBottom: 14 }}>
              {availableSpecials.map((s) => (
                <button
                  key={s.id}
                  className={`role-card ${tradedSpecialId === s.id ? "selected" : ""}`}
                  onClick={() => setTradedSpecialId(s.id)}
                >
                  <strong>{SPECIAL_EMOJI[s.type]} {SPECIAL_LABELS[s.type]}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
        <button
          className="btn btn-primary"
          disabled={!counterpartyId || !tradedSpecialId || submitting}
          onClick={() =>
            run(() =>
              supabase.rpc("resolve_verde", {
                p_special_id: meeting.special_id,
                p_operation: verdeOp,
                p_other_player_id: counterpartyId,
                p_target_special_id: tradedSpecialId,
              })
            )
          }
        >
          {submitting ? "…" : "🟢 Confirmar operación"}
        </button>
      </div>
    );
  }

  // ---------- AZUL ----------
  if (meeting.special_type === "azul") {
    const movable = specialDucks.filter((s) => s.type !== "azul" && s.status === "held");
    const fromAId = movable.find((s) => s.id === azulSpecialAId)?.owner_id ?? "";
    const secondCandidates = movable.filter((s) => s.id !== azulSpecialAId);
    const fromBId =
      azulMode === "intercambiar"
        ? movable.find((s) => s.id === azulSpecialBId)?.owner_id ?? ""
        : "";
    const holderCandidates = [...new Set([fromAId, azulMode === "mover" ? azulToAId : fromBId])].filter(
      (id) => id && id !== myPlayerId
    );

    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>🔵 Pato Especial a mover:</p>
        <div className="stack" style={{ marginBottom: 14 }}>
          {movable.map((s) => (
            <button
              key={s.id}
              className={`role-card ${azulSpecialAId === s.id ? "selected" : ""}`}
              onClick={() => {
                setAzulSpecialAId(s.id);
                setAzulSpecialBId("");
                setAzulNewOwnerId("");
              }}
            >
              <div>
                <strong>{SPECIAL_EMOJI[s.type]} {SPECIAL_LABELS[s.type]}</strong>
                <small>De: {nameOf(s.owner_id)}</small>
              </div>
            </button>
          ))}
        </div>

        {azulSpecialAId && (
          <>
            <p className="muted" style={{ marginBottom: 10 }}>¿Mover o intercambiar?</p>
            <div className="stack" style={{ marginBottom: 14 }}>
              <button
                className={`role-card ${azulMode === "mover" ? "selected" : ""}`}
                onClick={() => { setAzulMode("mover"); setAzulNewOwnerId(""); }}
              >
                <strong>Mover a otro Explorador</strong>
              </button>
              <button
                className={`role-card ${azulMode === "intercambiar" ? "selected" : ""}`}
                onClick={() => { setAzulMode("intercambiar"); setAzulNewOwnerId(""); }}
              >
                <strong>Intercambiar por otro Especial</strong>
              </button>
            </div>
          </>
        )}

        {azulSpecialAId && azulMode === "mover" && (
          <>
            <p className="muted" style={{ marginBottom: 10 }}>¿A quién se lo mueve?</p>
            <div className="stack" style={{ marginBottom: 14 }}>
              {explorers.filter((p) => p.id !== fromAId).map((p) => (
                <button
                  key={p.id}
                  className={`role-card ${azulToAId === p.id ? "selected" : ""}`}
                  onClick={() => { setAzulToAId(p.id); setAzulNewOwnerId(""); }}
                >
                  <strong>{p.name}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {azulSpecialAId && azulMode === "intercambiar" && (
          <>
            <p className="muted" style={{ marginBottom: 10 }}>¿Por qué Especial (de otro jugador)?</p>
            <div className="stack" style={{ marginBottom: 14 }}>
              {secondCandidates.map((s) => (
                <button
                  key={s.id}
                  className={`role-card ${azulSpecialBId === s.id ? "selected" : ""}`}
                  onClick={() => { setAzulSpecialBId(s.id); setAzulToBId(s.owner_id ?? ""); setAzulNewOwnerId(""); }}
                >
                  <div>
                    <strong>{SPECIAL_EMOJI[s.type]} {SPECIAL_LABELS[s.type]}</strong>
                    <small>De: {nameOf(s.owner_id)}</small>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {((azulMode === "mover" && azulToAId) || (azulMode === "intercambiar" && azulSpecialBId)) && (
          <>
            <p className="muted" style={{ marginBottom: 10 }}>¿Quién se queda con el Pato Azul? (nunca tú)</p>
            <div className="stack" style={{ marginBottom: 14 }}>
              {holderCandidates.map((id) => (
                <button
                  key={id}
                  className={`role-card ${azulNewOwnerId === id ? "selected" : ""}`}
                  onClick={() => setAzulNewOwnerId(id)}
                >
                  <strong>{nameOf(id)}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
        <button
          className="btn btn-primary"
          disabled={
            submitting ||
            !azulSpecialAId ||
            !azulNewOwnerId ||
            (azulMode === "mover" && !azulToAId) ||
            (azulMode === "intercambiar" && !azulSpecialBId)
          }
          onClick={() =>
            run(() =>
              supabase.rpc("resolve_azul", {
                p_special_id: meeting.special_id,
                p_mode: azulMode,
                p_special_a_id: azulSpecialAId,
                p_to_player_a_id: azulMode === "mover" ? azulToAId : fromBId,
                p_special_b_id: azulMode === "intercambiar" ? azulSpecialBId : null,
                p_to_player_b_id: azulMode === "intercambiar" ? fromAId : null,
                p_azul_new_owner_id: azulNewOwnerId,
              })
            )
          }
        >
          {submitting ? "…" : "🔵 Confirmar movimiento"}
        </button>
      </div>
    );
  }

  return null;
}
