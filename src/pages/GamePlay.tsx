import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DuckGrid from "../components/DuckGrid";
import SpecialDuckStrip from "../components/SpecialDuckStrip";
import MeetingBanner from "../components/MeetingBanner";
import JefePanel from "../components/JefePanel";
import { SPECIAL_LABELS } from "../types";
import type { Duck, Game, Player, SpecialDuck, SpecialType } from "../types";

type Selection =
  | { kind: "normal"; duck: Duck }
  | { kind: "special"; duck: SpecialDuck };

interface MeetingInfo {
  special_type: SpecialType;
  player_name: string;
  called_at: string;
}

export default function GamePlay() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [specialDucks, setSpecialDucks] = useState<SpecialDuck[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [closingMeeting, setClosingMeeting] = useState(false);

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

      async function refreshSpecialDucks() {
        const { data } = await supabase
          .from("special_ducks")
          .select("*")
          .eq("game_id", gameData.id);
        setSpecialDucks((data as SpecialDuck[]) ?? []);
      }

      await Promise.all([refreshPlayers(), refreshDucks(), refreshSpecialDucks()]);
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
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "special_ducks", filter: `game_id=eq.${gameData.id}` },
          refreshSpecialDucks
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameData.id}` },
          (payload) => setGame(payload.new as Game)
        )
        .subscribe();
    }

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [code]);

  async function confirmClaim() {
    if (!selection) return;
    setClaiming(true);
    setClaimError(null);

    const rpc =
      selection.kind === "normal"
        ? supabase.rpc("claim_duck", { p_duck_id: selection.duck.id })
        : supabase.rpc("claim_special_duck", { p_special_id: selection.duck.id });

    const { error: rpcError } = await rpc;
    setClaiming(false);
    if (rpcError) {
      setClaimError(rpcError.message);
      return;
    }
    setSelection(null);
  }

  async function handleCloseMeeting() {
    if (!code) return;
    setClosingMeeting(true);
    await supabase.rpc("close_meeting", { p_code: code });
    setClosingMeeting(false);
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

  const isJefe = myPlayer?.role === "jefe";
  const meeting = game.current_meeting as unknown as MeetingInfo | null;

  const meetingBanner = meeting && (
    <MeetingBanner
      meeting={meeting}
      isJefe={isJefe}
      onClose={handleCloseMeeting}
      closing={closingMeeting}
    />
  );

  if (isJefe) {
    return (
      <>
        {meetingBanner}
        <JefePanel game={game} players={players} ducks={ducks} specialDucks={specialDucks} />
      </>
    );
  }

  const foundCount = ducks.filter((d) => d.owner_id).length;
  const myFoundCount = ducks.filter((d) => d.owner_id === myPlayer?.id).length;
  const specialFoundCount = specialDucks.filter((d) => d.owner_id).length;
  const allFound =
    ducks.length > 0 &&
    foundCount === ducks.length &&
    specialDucks.length > 0 &&
    specialFoundCount === specialDucks.length;

  return (
    <>
      {meetingBanner}
      <div className="screen" style={{ paddingBottom: 100 }}>
        <div className="topbar">
          <h2>Partida {game.code}</h2>
        </div>

        <div className="stack" style={{ marginBottom: 18 }}>
          <div className="card" style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Tus patos: <strong className="num">{myFoundCount}</strong></span>
            <span className="muted">Total: <strong className="num">{foundCount} / 100</strong></span>
          </div>

          {allFound && (
            <div className="card" style={{ borderColor: "var(--yellow)", textAlign: "center" }}>
              <p style={{ color: "var(--yellow)", fontWeight: 700, margin: 0 }}>
                🎉 ¡Todos encontrados!
              </p>
            </div>
          )}
        </div>

        <p className="muted" style={{ marginBottom: 8 }}>Patos Especiales</p>
        <div className="stack" style={{ marginBottom: 20 }}>
          <SpecialDuckStrip
            specialDucks={specialDucks}
            onSelect={(duck) => setSelection({ kind: "special", duck })}
          />
        </div>

        <p className="muted" style={{ marginBottom: 8 }}>Patos Normales</p>
        <DuckGrid
          ducks={ducks}
          myPlayerId={myPlayer?.id}
          onSelect={(duck) => setSelection({ kind: "normal", duck })}
        />

        {selection && (
          <div className="modal-backdrop" onClick={() => !claiming && setSelection(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3>
                {selection.kind === "normal"
                  ? `¿Has encontrado el Pato ${selection.duck.number}?`
                  : `¿Has encontrado el ${SPECIAL_LABELS[selection.duck.type]}?`}
              </h3>
              {claimError && <div className="alert" style={{ marginTop: 12 }}>{claimError}</div>}
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelection(null)}
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
    </>
  );
}
