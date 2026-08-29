import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import DuckGrid from "../components/DuckGrid";
import SpecialDuckStrip from "../components/SpecialDuckStrip";
import MeetingBanner from "../components/MeetingBanner";
import MeetingResolutionPanel from "../components/MeetingResolutionPanel";
import BlockedOverlay from "../components/BlockedOverlay";
import JefePanel from "../components/JefePanel";
import SpecialSpinner from "../components/SpecialSpinner";
import Results from "./Results";
import SoundToggle from "../components/SoundToggle";
import { playFoundSound, playMeetingSound } from "../lib/sound";
import { SPECIAL_LABELS } from "../types";
import type { Duck, Game, Meeting, Player, SpecialDuck } from "../types";

type Selection =
  | { kind: "find_normal"; duck: Duck }
  | { kind: "find_special"; duck: SpecialDuck }
  | { kind: "activate_special"; duck: SpecialDuck };

export default function GamePlay() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [specialDucks, setSpecialDucks] = useState<SpecialDuck[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [closingMeetingId, setClosingMeetingId] = useState<string | null>(null);
  const seenMeetingIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!code) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let onlineHandler: (() => void) | null = null;

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

      async function refreshMeetings() {
        const { data } = await supabase
          .from("meetings")
          .select("*")
          .eq("game_id", gameData.id)
          .order("created_at", { ascending: true });
        const list = (data as Meeting[]) ?? [];
        setMeetings(list);
        for (const m of list) {
          if (!seenMeetingIds.current.has(m.id)) {
            seenMeetingIds.current.add(m.id);
            playMeetingSound();
          }
        }
      }

      async function refreshGame() {
        const { data } = await supabase
          .from("games")
          .select("*")
          .eq("id", gameData.id)
          .maybeSingle();
        if (data) setGame(data as Game);
      }

      async function refreshAll() {
        await Promise.all([
          refreshGame(),
          refreshPlayers(),
          refreshDucks(),
          refreshSpecialDucks(),
          refreshMeetings(),
        ]);
      }

      // Primera carga: no debe sonar por Reuniones que ya estaban ahí antes de entrar.
      const { data: initialMeetings } = await supabase
        .from("meetings")
        .select("*")
        .eq("game_id", gameData.id)
        .order("created_at", { ascending: true });
      const initialList = (initialMeetings as Meeting[]) ?? [];
      initialList.forEach((m) => seenMeetingIds.current.add(m.id));
      setMeetings(initialList);

      await Promise.all([refreshPlayers(), refreshDucks(), refreshSpecialDucks()]);
      setLoading(false);

      window.addEventListener("online", refreshAll);
      onlineHandler = refreshAll;

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
          { event: "*", schema: "public", table: "meetings", filter: `game_id=eq.${gameData.id}` },
          refreshMeetings
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameData.id}` },
          (payload) => setGame(payload.new as Game)
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") refreshAll();
        });
    }

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
      if (onlineHandler) window.removeEventListener("online", onlineHandler);
    };
  }, [code]);

  async function confirmSelection() {
    if (!selection) return;
    setSubmitting(true);
    setActionError(null);

    const rpc =
      selection.kind === "find_normal"
        ? supabase.rpc("claim_duck", { p_duck_id: selection.duck.id })
        : selection.kind === "find_special"
        ? supabase.rpc("claim_special_duck", { p_special_id: selection.duck.id })
        : supabase.rpc("activate_special", { p_special_id: selection.duck.id });

    const { error: rpcError } = await rpc;
    setSubmitting(false);
    if (rpcError) {
      setActionError(rpcError.message);
      return;
    }
    if (selection.kind === "find_normal" || selection.kind === "find_special") {
      playFoundSound();
    }
    setSelection(null);
  }

  async function handleCloseMeeting(meetingId: string) {
    setClosingMeetingId(meetingId);
    await supabase.rpc("close_meeting", { p_meeting_id: meetingId });
    setClosingMeetingId(null);
  }

  if (loading) {
    return (
      <div className="screen center">
        <SpecialSpinner />
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

  if (game.status === "resultados") {
    return <Results gameCode={game.code} players={players} />;
  }

  const isJefe = myPlayer?.role === "jefe";

  const publicMeetings = meetings.filter((m) => m.special_type !== "naranja");

  const visibleMeetingsForMe = meetings.filter((m) => {
    if (m.special_type !== "naranja") return true;
    return isJefe || myPlayer?.id === m.player_id;
  });

  const anyMeetingPending = meetings.length > 0;

  if (isJefe) {
    return (
      <>
        {publicMeetings.length > 0 && (
          <div className="meetings-stack">
            {publicMeetings.map((m) => (
              <MeetingBanner
                key={m.id}
                meeting={m}
                isJefe={true}
                onClose={() => handleCloseMeeting(m.id)}
                closing={closingMeetingId === m.id}
              />
            ))}
          </div>
        )}
        <JefePanel
          game={game}
          players={players}
          ducks={ducks}
          specialDucks={specialDucks}
          meetings={visibleMeetingsForMe}
          onCloseMeeting={handleCloseMeeting}
          closingMeetingId={closingMeetingId}
          myPlayerId={myPlayer?.id}
        />
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
      <SoundToggle />
      {publicMeetings.length > 0 && (
        <div className="meetings-stack">
          {publicMeetings.map((m) => (
            <MeetingBanner
              key={m.id}
              meeting={m}
              isJefe={false}
              onClose={() => handleCloseMeeting(m.id)}
              closing={closingMeetingId === m.id}
            />
          ))}
        </div>
      )}
      {myPlayer?.is_blocked_until && new Date(myPlayer.is_blocked_until).getTime() > Date.now() && (
        <BlockedOverlay blockedUntil={myPlayer.is_blocked_until} />
      )}
      <div className="screen" style={{ paddingBottom: 100 }}>
        <div className="topbar">
          <button className="back-btn" onClick={() => nav("/")} aria-label="Salir de la partida">
            ←
          </button>
          <h2>Partida {game.code}</h2>
        </div>

        {visibleMeetingsForMe.length > 0 && (
          <div className="stack" style={{ marginBottom: 18, gap: 12 }}>
            {visibleMeetingsForMe.map((m) => (
              <MeetingResolutionPanel
                key={m.id}
                meeting={m}
                players={players}
                specialDucks={specialDucks}
                ducks={ducks}
                myPlayerId={myPlayer?.id}
                isJefe={false}
                onClose={() => handleCloseMeeting(m.id)}
                closing={closingMeetingId === m.id}
              />
            ))}
          </div>
        )}

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

        <p className="muted" style={{ marginBottom: 8 }}>
          Patos Especiales{" "}
          <span style={{ opacity: 0.7 }}>
            {anyMeetingPending
              ? "· espera a que el Jefe cierre los avisos pendientes"
              : "· toca el megáfono cuando quieras activarlo"}
          </span>
        </p>
        <div className="stack" style={{ marginBottom: 20 }}>
          <SpecialDuckStrip
            specialDucks={specialDucks}
            myPlayerId={myPlayer?.id}
            blocked={anyMeetingPending}
            onSelect={(duck) => setSelection({ kind: "find_special", duck })}
            onActivate={(duck) => setSelection({ kind: "activate_special", duck })}
          />
        </div>

        <p className="muted" style={{ marginBottom: 8 }}>Patos Normales</p>
        <DuckGrid
          ducks={ducks}
          myPlayerId={myPlayer?.id}
          onSelect={(duck) => setSelection({ kind: "find_normal", duck })}
        />

        {selection && (
          <div className="modal-backdrop" onClick={() => !submitting && setSelection(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3>
                {selection.kind === "find_normal" &&
                  `¿Has encontrado el Pato ${selection.duck.number}?`}
                {selection.kind === "find_special" &&
                  `¿Has encontrado el ${SPECIAL_LABELS[selection.duck.type]}?`}
                {selection.kind === "activate_special" &&
                  `¿Activar el ${SPECIAL_LABELS[selection.duck.type]} ahora?`}
              </h3>
              {selection.kind === "activate_special" && (
                <p className="muted" style={{ marginTop: 8 }}>
                  Esto convoca una Reunión en la Charca para todos ahora
                  mismo. Solo hazlo cuando quieras usarlo de verdad.
                </p>
              )}
              {actionError && <div className="alert" style={{ marginTop: 12 }}>{actionError}</div>}
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelection(null)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={confirmSelection} disabled={submitting}>
                  {submitting
                    ? "…"
                    : selection.kind === "activate_special"
                    ? "📣 Activar"
                    : "¡Encontrado!"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
