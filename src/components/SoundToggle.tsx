import { useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "../lib/sound";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled());

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  }

  return (
    <button
      className="sound-toggle"
      onClick={toggle}
      aria-label={enabled ? "Silenciar sonido" : "Activar sonido"}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
