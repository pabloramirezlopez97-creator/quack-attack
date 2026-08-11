import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Stepper from "../components/Stepper";

const MODES = [
  {
    id: 1,
    title: "Un Pato Explorador",
    desc: "Una persona esconde, otra busca. Sin Especiales.",
  },
  {
    id: 2,
    title: "Dos Patos Exploradores",
    desc: "Pares e impares. Cada uno esconde y busca 50.",
  },
  {
    id: 3,
    title: "Tres o más Exploradores",
    desc: "Todos buscan a la vez. Se recomiendan los Especiales.",
  },
] as const;

export default function CreateGame() {
  const nav = useNavigate();
  const [mode, setMode] = useState<1 | 2 | 3>(3);
  const [name, setName] = useState("");
  const [maxExplorers, setMaxExplorers] = useState(20);
  const [maxJefes, setMaxJefes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Escribe tu nombre para continuar.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase
      .rpc("create_game", {
        p_mode: mode,
        p_max_explorers: mode === 2 ? 50 : maxExplorers,
        p_max_jefes: maxJefes,
        p_jefe_name: name.trim(),
      })
      .single();

    setLoading(false);

    if (rpcError || !data) {
      setError(rpcError?.message ?? "No se pudo crear la partida.");
      return;
    }

    const row = data as { game_code: string };
    nav(`/sala/${row.game_code}`);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={() => nav(-1)} aria-label="Volver">
          ←
        </button>
        <h2>Crear partida</h2>
      </div>

      <div className="stack">
        <div className="field">
          <label>Modo de juego</label>
        </div>

        {MODES.map((m) => (
          <button
            key={m.id}
            className={`role-card ${mode === m.id ? "selected" : ""}`}
            onClick={() => setMode(m.id)}
          >
            <div>
              <strong>{m.title}</strong>
              <small>{m.desc}</small>
            </div>
          </button>
        ))}

        {mode === 3 && (
          <div className="field">
            <label>Nº máximo de Patos Exploradores (1–100)</label>
            <Stepper
              value={maxExplorers}
              min={1}
              max={100}
              onChange={setMaxExplorers}
              label="Número máximo de Patos Exploradores"
            />
          </div>
        )}

        <div className="field">
          <label>Nº de Patos Jefe / Guardián (1–3)</label>
          <Stepper
            value={maxJefes}
            min={1}
            max={3}
            onChange={setMaxJefes}
            label="Número de Patos Jefe o Guardián"
          />
        </div>

        <div className="field">
          <label>Tu nombre (serás el Pato Jefe / Guardián)</label>
          <input
            type="text"
            placeholder="Ej: Pablo"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {error && <div className="alert">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creando…" : "🦆 Crear y obtener código"}
        </button>
      </div>
    </div>
  );
}
