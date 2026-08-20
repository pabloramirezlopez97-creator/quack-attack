import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { SPECIAL_EMOJI, SPECIAL_LABELS } from "../types";
import type { Duck, MeetingInfo, Player, SpecialDuck } from "../types";

interface Props {
  meeting: MeetingInfo;
  players: Player[];
  specialDucks: SpecialDuck[];
  ducks: Duck[];
  myPlayerId: string | undefined;
  isJefe: boolean;
  onClose?: () => void;
  closing?: boolean;
}

export default function MeetingResolutionPanel({
  meeting, players, specialDucks, ducks, myPlayerId, isJefe, onClose, closing,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [marronTargetId, setMarronTargetId] = useState("");

  const [negroStep, setNegroStep] = useState<"choice" | "digit" | "target" | "confirm">("choice");
  const [negroChoice, setNegroChoice] = useState<"dorado" | "normal" | null>(null);
  const [negroDigitInput, setNegroDigitInput] = useState("");
  const [negroDigit, setNegroDigit] = useState<number | null>(null);
  const [negroTargetId, setNegroTargetId] = useState("");

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
  const firedRef = useRef(false);

  useEffect(() => {
    setError(null);
    setMarronTargetId("");
    setNegroStep("choice");
    setNegroChoice(null);
    setNegroDigitInput("");
    setNegroDigit(null);
    setNegroTargetId("");
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
    firedRef.current = false;
  }, [meeting.special_id]);

  const nameOf = (id: string | null | undefined) => players.find((p) => p.id === id)?.name ?? "?";
  const explorers = players.filter((p) => p.role === "explorador");
  const otherExplorers = explorers.filter((p) => p.id !== meeting.player_id);

  async function run(call: () => ReturnType<typeof supabase.rpc>) {
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await call();
    setSubmitting(false);
    if (rpcError) {
      firedRef.current = false;
      setError(rpcError.message);
    }
  }

  // ---------- Ya resuelto: solo mostrar el resultado ----------
  if (meeting.resolution) {
    return (
      <div className="card" style={{ borderColor: "var(--success)" }}>
        <p style={{ color: "var(--success)", fontWeight: 700, marginBottom: 6 }}>
          ✅ {meeting.resolution}
        </p>
        {meeting.hint_text && (
          <p className="muted">Pista: “{meeting.hint_text}”</p>
        )}
        {isJefe && onClose ? (
          <button
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            onClick={onClose}
            disabled={closing}
          >
            {closing ? "…" : "Cerrar aviso"}
          </button>
        ) : (
          <p className="muted" style={{ marginTop: 6 }}>
            El Pato Jefe cerrará el aviso cuando corresponda.
          </p>
        )}
      </div>
    );
  }

  // ---------- NARANJA: la escribe el Jefe, no el Explorador ----------
  if (meeting.special_type === "naranja") {
    if (!isJefe) {
      return (
        <div className="card">
          <p className="muted">
            🟠{" "}
            {meeting.naranja_typing
              ? "El Pato Jefe / Guardián ya está escribiendo tu pista…"
              : "Esperando a que el Pato Jefe / Guardián vea el aviso…"}
          </p>
        </div>
      );
    }
    return (
      <NaranjaJefeForm
        meeting={meeting}
        hintText={hintText}
        setHintText={setHintText}
        submitting={submitting}
        error={error}
        onSubmit={() =>
          run(() => supabase.rpc("resolve_naranja", { p_special_id: meeting.special_id, p_hint_text: hintText.trim() }))
        }
      />
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

  // ---------- MARRÓN: toca el reloj → confirmar → bloquea ----------
  if (meeting.special_type === "marron") {
    if (marronTargetId) {
      const targetName = nameOf(marronTargetId);
      return (
        <div className="card">
          <p className="muted" style={{ marginBottom: 12 }}>
            🟤 ¿Bloquear a <strong style={{ color: "var(--white)" }}>{targetName}</strong> durante 30 segundos?
          </p>
          {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              disabled={submitting}
              onClick={() => setMarronTargetId("")}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={submitting}
              onClick={() =>
                run(() =>
                  supabase.rpc("resolve_marron", {
                    p_special_id: meeting.special_id,
                    p_target_player_id: marronTargetId,
                  })
                )
              }
            >
              {submitting ? "…" : "🟤 Confirmar bloqueo"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>
          🟤 Toca el reloj del Explorador que quieres bloquear 30 segundos:
        </p>
        <div>
          {otherExplorers.map((p) => (
            <div className="player-row" key={p.id}>
              <span>🦆 {p.name}</span>
              <button
                className="clock-btn"
                aria-label={`Bloquear a ${p.name} 30 segundos`}
                onClick={() => setMarronTargetId(p.id)}
              >
                ⏰
              </button>
            </div>
          ))}
          {otherExplorers.length === 0 && (
            <p className="muted">No hay otros Exploradores a quien bloquear.</p>
          )}
        </div>
      </div>
    );
  }

  // ---------- NEGRO: elegir → (cifra) → objetivo (sin vuelta atrás) → confirmar ----------
  if (meeting.special_type === "negro") {
    // Paso 1: elegir qué robar
    if (negroStep === "choice") {
      return (
        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>⚫ ¿Qué roba?</p>
          <div className="stack">
            <button
              className="role-card"
              onClick={() => { setNegroChoice("dorado"); setNegroStep("target"); }}
            >
              <strong>🟡 Robar el Pato Dorado</strong>
            </button>
            <button
              className="role-card"
              onClick={() => { setNegroChoice("normal"); setNegroStep("digit"); }}
            >
              <strong>Robar Patos Normales</strong>
            </button>
          </div>
        </div>
      );
    }

    // Paso 2 (solo si roba Normales): elegir la cifra 0-9
    if (negroStep === "digit") {
      const digitValue = Number(negroDigitInput);
      const digitValid =
        negroDigitInput.trim() !== "" && Number.isInteger(digitValue) && digitValue >= 0 && digitValue <= 9;
      return (
        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>
            Escribe una cifra del 0 al 9. Se robarán los Patos Normales que terminen en ese número:
          </p>
          <div className="field" style={{ marginBottom: 14 }}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={9}
              placeholder="Ej: 3"
              value={negroDigitInput}
              onChange={(e) => setNegroDigitInput(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            disabled={!digitValid}
            onClick={() => { setNegroDigit(digitValue); setNegroStep("target"); }}
          >
            Siguiente
          </button>
        </div>
      );
    }

    // Paso 3: elegir a quién robar — 🥷 y sin vuelta atrás
    if (negroStep === "target") {
      return (
        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>
            ⚫ Toca al Explorador objetivo. <strong style={{ color: "var(--danger)" }}>Ojo: no hay vuelta atrás.</strong>
          </p>
          <div>
            {otherExplorers.map((p) => (
              <div className="player-row" key={p.id}>
                <span>🦆 {p.name}</span>
                <button
                  className="thief-btn"
                  disabled={submitting}
                  aria-label={`Robar a ${p.name}`}
                  onClick={() => {
                    if (firedRef.current) return;
                    if (negroChoice === "dorado") {
                      firedRef.current = true;
                      setNegroTargetId(p.id);
                      run(() =>
                        supabase.rpc("negro_attack", {
                          p_special_id: meeting.special_id,
                          p_choice: "dorado",
                          p_target_player_id: p.id,
                          p_digit: null,
                        })
                      );
                    } else {
                      setNegroTargetId(p.id);
                      setNegroStep("confirm");
                    }
                  }}
                >
                  🥷
                </button>
              </div>
            ))}
            {otherExplorers.length === 0 && (
              <p className="muted">No hay otros Exploradores a quien robar.</p>
            )}
          </div>
          {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
        </div>
      );
    }

    // Paso 4 (solo Normales): confirmar el robo de los patos que terminan en esa cifra
    if (negroStep === "confirm") {
      const matching = ducks.filter(
        (d) => d.owner_id === negroTargetId && negroDigit !== null && d.number % 10 === negroDigit
      );
      const targetName = nameOf(negroTargetId);
      return (
        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>
            {targetName} tiene {matching.length} Pato(s) Normal(es) terminados en {negroDigit}:
          </p>
          <div className="stack" style={{ marginBottom: 14 }}>
            {matching.map((d) => (
              <div className="player-row" key={d.id}>
                <span className="num">Pato {String(d.number).padStart(2, "0")}</span>
              </div>
            ))}
            {matching.length === 0 && <p className="muted">Ninguno — aun así, se consumirá el Pato Negro.</p>}
          </div>
          {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}
          <button
            className="btn btn-primary"
            disabled={submitting}
            onClick={() =>
              run(() =>
                supabase.rpc("negro_attack", {
                  p_special_id: meeting.special_id,
                  p_choice: "normal",
                  p_target_player_id: negroTargetId,
                  p_digit: negroDigit,
                })
              )
            }
          >
            {submitting ? "…" : "⚫ Robar"}
          </button>
        </div>
      );
    }

    return null;
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

    const myNormalCount = ducks.filter((d) => d.owner_id === myPlayerId).length;
    const counterpartyNormalCount = counterpartyId
      ? ducks.filter((d) => d.owner_id === counterpartyId).length
      : null;
    const canComprar = myNormalCount >= 3;
    const canVenderTo = counterpartyNormalCount === null || counterpartyNormalCount >= 2;

    return (
      <div className="card">
        <p className="muted" style={{ marginBottom: 10 }}>🟢 ¿Comprar o vender?</p>
        <div className="stack" style={{ marginBottom: 6 }}>
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

        {verdeOp === "comprar" && !canComprar && (
          <div className="alert" style={{ marginBottom: 14 }}>
            🟢 Todavía no puedes comprar: tienes {myNormalCount} Patos Normales
            propios y hacen falta 3.
          </div>
        )}

        <p className="muted" style={{ marginBottom: 10, marginTop: 8 }}>Con qué jugador:</p>
        <div className="stack" style={{ marginBottom: 6 }}>
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

        {verdeOp === "vender" && counterpartyId && !canVenderTo && (
          <div className="alert" style={{ marginBottom: 14 }}>
            🟢 {players.find((p) => p.id === counterpartyId)?.name} tiene{" "}
            {counterpartyNormalCount} Patos Normales y hacen falta 2 para
            poder pagarte. Elige a otro jugador o espera.
          </div>
        )}

        {counterpartyId && (verdeOp === "vender" ? canVenderTo : canComprar) && (
          <>
            <p className="muted" style={{ marginBottom: 10, marginTop: 8 }}>
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
          disabled={
            !counterpartyId ||
            !tradedSpecialId ||
            submitting ||
            (verdeOp === "comprar" ? !canComprar : !canVenderTo)
          }
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

// Sub-componente aparte para poder usar useEffect (marcar "escribiendo") solo
// en la pantalla del Jefe, sin romper las reglas de hooks del componente padre.
function NaranjaJefeForm({
  meeting,
  hintText,
  setHintText,
  submitting,
  error,
  onSubmit,
}: {
  meeting: MeetingInfo;
  hintText: string;
  setHintText: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  useEffect(() => {
    supabase.rpc("mark_naranja_typing", { p_special_id: meeting.special_id });
    // Solo una vez al entrar en esta pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting.special_id]);

  return (
    <div className="card" style={{ borderColor: "var(--yellow)" }}>
      <p style={{ color: "var(--yellow)", fontWeight: 700, marginBottom: 10 }}>
        🟠 El Explorador {meeting.player_name} ha encontrado el Pato Naranja.
        Dale una pista para encontrar más patos.
      </p>
      <p className="muted" style={{ marginBottom: 10 }}>
        La pista debe ayudar a encontrar UN Pato Normal — nunca puede señalar un Especial:
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
      <button className="btn btn-primary" disabled={!hintText.trim() || submitting} onClick={onSubmit}>
        {submitting ? "…" : "🟠 Enviar pista"}
      </button>
    </div>
  );
}
