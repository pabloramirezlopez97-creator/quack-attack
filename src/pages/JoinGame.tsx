// → src/pages/
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SoundToggle from "../components/SoundToggle";
import { startMusic } from "../lib/music";
import type { JoinRequest, Role } from "../types";

export default function JoinGame() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [code, setCode] = useState(params.get("code") ?? "");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("explorador");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Si la partida ya empezó hay que esperar a que el Jefe acepte la solicitud.
  const [waiting, setWaiting] = useState<{ requestId: string; gameCode: string } | null>(null);
  const [requestStatus, setRequestStatus] = useState<JoinRequest["status"]>("pending");

  async function handleJoin() {
    if (!code.trim() || !name.trim()) {
      setError("Rellena el código de sala y tu nombre.");
      return;
    }
    setLoading(true);
    setError(null);

    // Si el navegador perdió la sesión anónima, la recuperamos antes de continuar.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      await supabase.auth.signInAnonymously();
    }

    const { data, error: rpcError } = await supabase
      .rpc("join_game", {
        p_code: code.trim().toUpperCase(),
        p_name: name.trim(),
        p_role: role,
      })
      .single();

    setLoading(false);

    if (rpcError || !data) {
      setError(rpcError?.message ?? "No se pudo unir a la partida.");
      return;
    }

    // Si entraste con el código de un equipo, la sala es la de la partida a la que
    // pertenece ese equipo, no el código que has escrito.
    const row = data as {
      out_game_code?: string;
      out_status?: string;
      out_request_id?: string | null;
    };
    const gameCode = row.out_game_code ?? code.trim().toUpperCase();

    if (row.out_status === "pending" && row.out_request_id) {
      setRequestStatus("pending");
      setWaiting({ requestId: row.out_request_id, gameCode });
      return;
    }
    nav(`/sala/${gameCode}`);
  }

  async function handleCancelRequest() {
    if (waiting) {
      await supabase.rpc("cancel_join_request", { p_request_id: waiting.requestId });
    }
    setWaiting(null);
  }

  // Mientras esperamos, escuchamos la respuesta del Jefe (tiempo real + comprobación cada 3 s).
  useEffect(() => {
    if (!waiting) return;
    let active = true;

    async function check() {
      const { data } = await supabase
        .from("join_requests")
        .select("status")
        .eq("id", waiting!.requestId)
        .maybeSingle();
      if (!active || !data) return;
      const status = (data as { status: JoinRequest["status"] }).status;
      if (status === "accepted") {
        nav(`/partida/${waiting!.gameCode}`);
      } else if (status === "rejected") {
        setRequestStatus("rejected");
      }
    }

    const channel = supabase
      .channel(`join-request-${waiting.requestId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "join_requests", filter: `id=eq.${waiting.requestId}` },
        check
      )
      .subscribe();
    const timer = window.setInterval(check, 3000);

    return () => {
      active = false;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [waiting, nav]);

  useEffect(() => {
    startMusic();
  }, []);

  if (waiting) {
    return (
      <div className="screen center">
        <SoundToggle />
        <div className="card" style={{ textAlign: "center", maxWidth: 360 }}>
          {requestStatus === "rejected" ? (
            <>
              <h3>El Jefe ha rechazado tu solicitud</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                No has podido unirte a esta partida.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => nav("/")}
              >
                Volver al inicio
              </button>
            </>
          ) : (
            <>
              <h3>🦆 Esperando al Pato Jefe…</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                La partida ya ha empezado. Hemos avisado al Jefe de que quieres unirte; en cuanto
                te acepte entrarás automáticamente.
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={handleCancelRequest}
              >
                Cancelar solicitud
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <SoundToggle />
      <div className="topbar">
        <button className="back-btn" onClick={() => nav(-1)} aria-label="Volver">
          ←
        </button>
        <h2>Unirse a partida</h2>
      </div>

      <div className="stack">
        <div className="field">
          <label>Código de la sala</label>
          <input
            className="code-input"
            type="text"
            placeholder="PATO123"
            value={code}
            maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <div className="field">
          <label>Tu nombre</label>
          <input
            type="text"
            placeholder="Ej: María"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>¿Cómo vas a jugar?</label>
        </div>

        <button
          className={`role-card ${role === "explorador" ? "selected" : ""}`}
          onClick={() => setRole("explorador")}
        >
          <img src="/assets/ducks/pato explorador.png" alt="" />
          <div>
            <strong>Pato Explorador</strong>
            <small>Buscas patos y sumas puntos</small>
          </div>
        </button>

        <button
          className={`role-card ${role === "jefe" ? "selected" : ""}`}
          onClick={() => setRole("jefe")}
        >
          <img src="/assets/ducks/pato jefe.png" alt="" />
          <div>
            <strong>Pato Jefe / Guardián</strong>
            <small>Controlas y supervisas la partida</small>
          </div>
        </button>

        {error && <div className="alert">{error}</div>}

        <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
          {loading ? "Uniéndote…" : "🦆 Unirme a la partida"}
        </button>
      </div>
    </div>
  );
}
