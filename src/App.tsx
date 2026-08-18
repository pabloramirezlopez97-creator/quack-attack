import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ensureSession } from "./supabaseClient";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";
import JoinGame from "./pages/JoinGame";
import Lobby from "./pages/Lobby";
import GamePlay from "./pages/GamePlay";
import ConnectionStatus from "./components/ConnectionStatus";

export default function App() {
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    ensureSession()
      .then(() => setReady(true))
      .catch((err) => {
        console.error(err);
        setSessionError(
          "No se pudo conectar. Revisa tu conexión a internet e inténtalo de nuevo."
        );
      });
  }, []);

  if (sessionError) {
    return (
      <div className="screen center">
        <div className="alert">{sessionError}</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="screen center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ConnectionStatus />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CreateGame />} />
        <Route path="/unirse" element={<JoinGame />} />
        <Route path="/sala/:code" element={<Lobby />} />
        <Route path="/partida/:code" element={<GamePlay />} />
      </Routes>
    </BrowserRouter>
  );
}
