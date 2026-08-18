// Sonidos cortos generados con Web Audio API — sin archivos de audio que subir,
// y compatibles con Safari de iPhone/iPad (a diferencia de la vibración, que Apple no permite).

const STORAGE_KEY = "quackattack_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "1";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function beep(freq: number, durationMs: number, delayMs = 0, volume = 0.15) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const start = audioCtx.currentTime + delayMs / 1000;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000);
}

// Pato encontrado: un "pop" ascendente breve.
export function playFoundSound() {
  if (!isSoundEnabled()) return;
  beep(520, 90);
  beep(780, 110, 90);
}

// Reunión en la Charca convocada: aviso algo más largo, dos tonos.
export function playMeetingSound() {
  if (!isSoundEnabled()) return;
  beep(400, 160);
  beep(300, 200, 160);
}
