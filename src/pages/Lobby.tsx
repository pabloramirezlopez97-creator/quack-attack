import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import type { Game, Player } from "../types";

const MODE_LABEL: Record<number, string> = {
  1: "Un Pato Explorador",
  2: "Dos Patos Exploradores",
  3: "Tres o más Exploradores",
};

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (gameError || !gameData) {
        setError("No se encontró ninguna partida con ese código.");
        setLoading(false);
        return;
      }
      setGame(gameData as Game);

      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id)
        .order("created_at", { ascending: true });
      setPlayers((playersData as Player[]) ?? []);
      setLoading(false);

      // Tiempo real: nuevos jugadores entrando a la sala
      channel = supabase
        .channel(`lobby-${gameData.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `game_id=eq.${gameData.id}`,
          },
          async () => {
            const { data: refreshed } = await supabase
              .from("players")
              .select("*")
              .eq("game_id", gameData.id)
              .order("created_at", { ascending: true });
            setPlayers((refreshed as Player[]) ?? []);
          }
        )
        .subscribe();
    }

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  function copyCode() {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="screen center">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="screen center">
        <div className="alert">{error}</div>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => nav("/")}>
          Volver al inicio
        </button>
      </div>
    );
  }

  const jefes = players.filter((p) => p.role === "jefe");
  const exploradores = players.filter((p) => p.role === "explorador");

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={() => nav("/")} aria-label="Salir">
          ←
        </button>
        <h2>Sala de espera</h2>
      </div>

      <div className="stack">
        <button className="game-code" onClick={copyCode} aria-label="Copiar código">
          {game.code}
        </button>
        <p className="muted" style={{ textAlign: "center", marginTop: -6 }}>
          {copied ? "¡Código copiado!" : "Toca el código para copiarlo · compártelo con el grupo"}
        </p>

        <div className="card">
          <p className="muted" style={{ marginBottom: 10 }}>
            Modo: <strong style={{ color: "var(--white)" }}>{MODE_LABEL[game.mode]}</strong>
          </p>

          {jefes.map((p) => (
            <div className="player-row" key={p.id}>
              <span>🦆 {p.name}</span>
              <span className="role-pill jefe">Jefe</span>
            </div>
          ))}
          {exploradores.map((p) => (
            <div className="player-row" key={p.id}>
              <span>🦆 {p.name}</span>
              <span className="role-pill explorador">Explorador</span>
            </div>
          ))}
          {players.length === 0 && (
            <p className="muted">Todavía no hay nadie más aquí…</p>
          )}
        </div>

        <div className="card">
          <p className="muted">
            El Pato Jefe / Guardián esconde ahora los 100 Patos Normales,
            emparejando siempre cada Pato Especial con uno Normal. Cuando
            el escondite esté listo, ¡empieza la búsqueda!
          </p>
        </div>
      </div>
    </div>
  );
}
