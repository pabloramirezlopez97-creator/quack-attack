import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import LegalFooter from "../components/LegalFooter";
import type { GameStatus, Role } from "../types";

interface ActiveGame {
  code: string;
  status: GameStatus;
  role: Role;
}

export default function Home() {
  const nav = useNavigate();
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkActiveGame() {
      const { data: userData } = await supabase.auth.getUser();
      const myId = userData.user?.id;
      if (!myId) return;

      const { data } = await supabase
        .from("players")
        .select("role, created_at, games(code, status)")
        .eq("session_id", myId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || !data) return;

      // games viene como objeto embebido (relación players -> games)
      const game = data.games as unknown as { code: string; status: GameStatus } | null;
      if (game) {
        setActiveGame({ code: game.code, status: game.status, role: data.role as Role });
      }
    }

    checkActiveGame();
    return () => {
      cancelled = true;
    };
  }, []);

  function resume() {
    if (!activeGame) return;
    if (activeGame.status === "lobby") {
      nav(`/sala/${activeGame.code}`);
    } else {
      nav(`/partida/${activeGame.code}`);
    }
  }

  return (
    <div className="screen center">
      <img
        src="/assets/branding/logo.png"
        alt="Quack Attack"
        className="logo-img"
      />

      <p className="muted" style={{ marginTop: 18, maxWidth: 320 }}>
        Complemento digital opcional para tu juego físico. El reglamento
        de patos manda siempre.
      </p>

      {activeGame && (
        <button
          className="btn btn-secondary"
          style={{ marginTop: 24, borderColor: "var(--yellow)" }}
          onClick={resume}
        >
          🦆 Continuar partida {activeGame.code}
        </button>
      )}

      <div className="stack" style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={() => nav("/crear")}>
          🦆 CREAR PARTIDA
        </button>
        <button className="btn btn-secondary" onClick={() => nav("/unirse")}>
          UNIRSE A PARTIDA
        </button>
      </div>

      <img
        src="/assets/ducks/pato_explorador.png"
        alt=""
        className="mascot-corner"
      />

      <LegalFooter />
    </div>
  );
}
