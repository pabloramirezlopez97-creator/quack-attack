import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import type { Role } from "../types";

export default function JoinGame() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [code, setCode] = useState(params.get("code") ?? "");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("explorador");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!code.trim() || !name.trim()) {
      setError("Rellena el código de sala y tu nombre.");
      return;
    }
    setLoading(true);
    setError(null);

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

    nav(`/sala/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="screen">
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
          <img src="/assets/ducks/pato_explorador.png" alt="" />
          <div>
            <strong>Pato Explorador</strong>
            <small>Buscas patos y sumas puntos</small>
          </div>
        </button>

        <button
          className={`role-card ${role === "jefe" ? "selected" : ""}`}
          onClick={() => setRole("jefe")}
        >
          <img src="/assets/ducks/pato_jefe.png" alt="" />
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
