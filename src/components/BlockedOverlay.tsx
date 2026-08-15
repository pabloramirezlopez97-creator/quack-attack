import { useEffect, useState } from "react";

interface BlockedOverlayProps {
  blockedUntil: string;
}

export default function BlockedOverlay({ blockedUntil }: BlockedOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => remaining(blockedUntil));
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const left = remaining(blockedUntil);
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        setShowDone(true);
        setTimeout(() => setShowDone(false), 2000);
      }
    }, 250);
    return () => clearInterval(id);
  }, [blockedUntil]);

  if (secondsLeft <= 0) {
    if (!showDone) return null;
    return (
      <div className="blocked-overlay">
        <p className="blocked-label" style={{ fontSize: "1.2rem" }}>
          🦆 ¡A NADAR DE NUEVO!
        </p>
      </div>
    );
  }

  return (
    <div className="blocked-overlay">
      <span className="blocked-emoji">🟤</span>
      <p className="blocked-count">{String(secondsLeft).padStart(2, "0")}</p>
      <p className="blocked-label">Bloqueado por el Pato Marrón</p>
    </div>
  );
}

function remaining(blockedUntil: string): number {
  const diffMs = new Date(blockedUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 1000));
}
