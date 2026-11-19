import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SoundToggle from "../components/SoundToggle";
import { startMusic } from "../lib/music";
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
  {
    id: 4,
    title: "Equipos de Exploradores",
    desc: "Para grupos grandes: cada equipo tiene su propio código y marcador.",
  },
] as const;

const TEAM_EXAMPLES = ["Equipo Alpha", "Equipo Beta", "Equipo Gamma", "Equipo Delta", "Equipo Omega", "Equipo Sigma"];
const MIN_TEAMS = 2;
const MAX_TEAMS = 12;

export default function CreateGame() {
  const nav = useNavigate();
  const [mode, setMode] = useState<1 | 2 | 3 | 4>(3);
  const [name, setName] = useState("");
  const [maxExplorers, setMaxExplorers] = useState(20);
  const [maxJefes, setMaxJefes] = useState(1);
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startMusic();
  }, []);

  function handleTeamCountChange(n: number) {
    setTeamCount(n);
    setTeamNames((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  }

  function updateTeamName(index: number, value: string) {
    setTeamNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Escribe tu nombre para continuar.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      await supabase.auth.signInAnonymously();
    }

    if (mode === 4) {
      const nombresLimpios = teamNames.map((t) => t.trim());
      if (nombresLimpios.some((t) => !t)) {
        setError("Ponle un nombre a cada equipo antes de continuar.");
        return;
      }
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc("create_team_game", {
        p_max_jefes: maxJefes,
        p_jefe_name: name.trim(),
        p_team_names: nombresLimpios,
      });

      setLoading(false);

      if (rpcError || !data || data.length === 0) {
        setError(rpcError?.message ?? "No se pudo crear la partida.");
        return;
      }

      const row = data[0] as { game_code: string };
      nav(`/sala/${row.game_code}`);
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
      <SoundToggle />
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

        {mode === 4 && (
          <>
            <div className="field">
              <label>Número de equipos ({MIN_TEAMS}–{MAX_TEAMS})</label>
              <Stepper
                value={teamCount}
                min={MIN_TEAMS}
                max={MAX_TEAMS}
                onChange={handleTeamCountChange}
                label="Número de equipos"
              />
            </div>

            {teamNames.map((teamName, i) => (
              <div className="field" key={i}>
                <label>Nombre del equipo {i + 1}</label>
                <input
                  type="text"
                  placeholder={`Ej: ${TEAM_EXAMPLES[i % TEAM_EXAMPLES.length]}`}
                  value={teamName}
                  maxLength={24}
                  onChange={(e) => updateTeamName(i, e.target.value)}
                />
              </div>
            ))}

            <div className="field">
              <p className="muted">
                Al crear la partida, cada equipo recibirá su propio código. Cualquiera que
                se una con ese código entrará automáticamente en ese equipo, y todo lo que
                encuentren sumará al marcador compartido del equipo.
              </p>
            </div>
          </>
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
