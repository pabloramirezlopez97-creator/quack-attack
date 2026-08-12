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
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

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

      const { data: userData } = await supabase.auth.getUser();
      const myId = userData.user?.id;

      async function refreshPlayers() {
        const { data: refreshed } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", gameData.id)
          .order("created_at", { ascending: true });
        const list = (refreshed as Player[]) ?? [];
        setPlayers(list);
        setMyPlayer(list.find((p) => p.session_id === myId) ?? null);
      }

      await refreshPlayers();
      setLoading(false);

      // Tiempo real: jugadores entrando + cambios de estado de la partida
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
          refreshPlayers
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameData.id}`,
          },
          (payload) => {
            const updated = payload.new as Game;
            setGame(updated);
            if (updated.status === "en_curso") {
              nav(`/partida/${updated.code}`);
            }
          }
        )
        .subscribe();
    }

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [code, nav]);

  function copyCode() {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleStart() {
    if (!code) return;
    setStarting(true);
    const { error: rpcError } = await supabase.rpc("start_game", { p_code: code });
    setStarting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    nav(`/partida/${code}`);
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
  const isJefe = myPlayer?.role === "jefe";

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

        {isJefe ? (
          <>
            <div className="card">
              <p className="muted">
                Esconde ahora los 100 Patos Normales, emparejando siempre
                cada Pato Especial con uno Normal. Cuando el escondite esté
                listo, pulsa el botón para abrir la búsqueda a todos los
                Exploradores.
              </p>
            </div>
            {error && <div className="alert">{error}</div>}
            <button className="btn btn-primary" onClick={handleStart} disabled={starting}>
              {starting ? "Iniciando…" : "🦆 Empezar búsqueda"}
            </button>
          </>
        ) : (
          <div className="card">
            <p className="muted">
              El Pato Jefe / Guardián está escondiendo los patos. En cuanto
              pulse "Empezar búsqueda", entrarás automáticamente — no hace
              falta que hagas nada más aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
