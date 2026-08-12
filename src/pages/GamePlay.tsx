import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DuckGrid, { ownerName } from "../components/DuckGrid";
import type { Duck, Game, Player } from "../types";

export default function GamePlay() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDuck, setSelectedDuck] = useState<Duck | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

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
        const { data } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", gameData.id)
          .order("created_at", { ascending: true });
        const list = (data as Player[]) ?? [];
        setPlayers(list);
        setMyPlayer(list.find((p) => p.session_id === myId) ?? null);
      }

      async function refreshDucks() {
        const { data } = await supabase
          .from("ducks")
          .select("*")
          .eq("game_id", gameData.id)
          .order("number", { ascending: true });
        setDucks((data as Duck[]) ?? []);
      }

      await Promise.all([refreshPlayers(), refreshDucks()]);
      setLoading(false);

      channel = supabase
        .channel(`game-${gameData.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameData.id}` },
          refreshPlayers
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ducks", filter: `game_id=eq.${gameData.id}` },
          refreshDucks
        )
        .subscribe();
    }

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  async function confirmClaim() {
    if (!selectedDuck) return;
    setClaiming(true);
    setClaimError(null);
    const { error: rpcError } = await supabase.rpc("claim_duck", {
      p_duck_id: selectedDuck.id,
    });
    setClaiming(false);
    if (rpcError) {
      setClaimError(rpcError.message);
      return;
    }
    setSelectedDuck(null);
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

  const foundCount = ducks.filter((d) => d.owner_id).length;
  const myFoundCount = ducks.filter((d) => d.owner_id === myPlayer?.id).length;

  if (myPlayer?.role === "jefe") {
    return (
      <div className="screen">
        <div className="topbar">
          <h2>Partida {game.code}</h2>
        </div>
        <div className="stack">
          <div className="card">
            <p className="muted" style={{ marginBottom: 10 }}>
              Progreso general: <strong style={{ color: "var(--white)" }}>{foundCount} / 100</strong>
            </p>
            {players
              .filter((p) => p.role === "explorador")
              .map((p) => (
                <div className="player-row" key={p.id}>
                  <span>🦆 {p.name}</span>
                  <span className="muted">{p.score} pts</span>
                </div>
              ))}
          </div>
          <div className="card">
            <p className="muted">
              El panel completo del Pato Jefe (Especiales, Reuniones en la
              Charca, finalizar partida) llega en la siguiente fase. Por
              ahora, aquí puedes seguir el progreso en vivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ paddingBottom: 100 }}>
      <div className="topbar">
        <h2>Partida {game.code}</h2>
      </div>

      <div className="stack" style={{ marginBottom: 18 }}>
        <div className="card" style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="muted">Tus patos: <strong style={{ color: "var(--white)" }}>{myFoundCount}</strong></span>
          <span className="muted">Total: <strong style={{ color: "var(--white)" }}>{foundCount} / 100</strong></span>
        </div>
      </div>

      <DuckGrid ducks={ducks} myPlayerId={myPlayer?.id} onSelect={setSelectedDuck} />

      {selectedDuck && (
        <div className="modal-backdrop" onClick={() => !claiming && setSelectedDuck(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>¿Has encontrado el Pato {selectedDuck.number}?</h3>
            {claimError && <div className="alert" style={{ marginTop: 12 }}>{claimError}</div>}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedDuck(null)}
                disabled={claiming}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={confirmClaim} disabled={claiming}>
                {claiming ? "…" : "¡Encontrado!"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Se reexporta por si otras pantallas necesitan el nombre del dueño de un pato.
export { ownerName };
