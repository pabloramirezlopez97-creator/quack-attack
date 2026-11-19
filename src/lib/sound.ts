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
  // Avisa a la música de fondo para que se silencie / reactive al instante.
  window.dispatchEvent(new Event("quackattack-sound-change"));
}

let ctx: AudioContext | null = null;

export function getSharedContext(): AudioContext | null {
  return getContext();
}

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

// iPhone/iPad no dejan sonar nada hasta que el usuario toca la pantalla al menos
// una vez con el audio "desbloqueado". Lo hacemos en el primer toque de cualquier
// pantalla (también la del Jefe) y lo repetimos si el sistema vuelve a suspenderlo.
let unlocked = false;
function unlockAudio() {
  const c = getContext();
  if (!c) return;
  if (!unlocked) {
    try {
      const buf = c.createBuffer(1, 1, 22050);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
      unlocked = true;
    } catch {
      /* ignorar */
    }
  }
}
if (typeof window !== "undefined") {
  ["pointerdown", "touchend", "click", "keydown"].forEach((ev) =>
    window.addEventListener(ev, unlockAudio, { passive: true })
  );
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

// Al pulsar un número o un Pato Especial (abrir la ventana de confirmación):
// el "pop" ascendente breve de siempre.
export function playSelectSound() {
  if (!isSoundEnabled()) return;
  beep(520, 90);
  beep(780, 110, 90);
}

// Al pulsar "¡Encontrado!": un "cuack" de pato de dibujos animados.
// Se sintetiza con un oscilador "sierra" (voz nasal) cuyo tono baja de golpe,
// pasado por un filtro que barre de "u" a "a" para dar la vocal.
export function playQuackSound() {
  if (!isSoundEnabled()) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const dur = 0.22;

  const osc = audioCtx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(260, t + dur);

  // Pequeño vibrato rápido: da el carácter "graznido".
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 38;
  lfoGain.gain.value = 22;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(650, t);
  filter.frequency.exponentialRampToValueAtTime(1500, t + 0.07);
  filter.frequency.exponentialRampToValueAtTime(900, t + dur);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(0.5, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + dur + 0.02);
  lfo.stop(t + dur + 0.02);
}

// Campana de alarma: tres golpes de campana al activar un Pato Especial.
function bellStrike(freq: number, delayMs: number) {
  beep(freq, 650, delayMs, 0.18);
  beep(freq * 2.76, 380, delayMs, 0.07); // parcial inarmónico: timbre metálico
  beep(freq * 5.4, 200, delayMs, 0.04);
}
export function playAlarmSound() {
  if (!isSoundEnabled()) return;
  bellStrike(880, 0);
  bellStrike(880, 280);
  bellStrike(880, 560);
}

// Reunión en el Estanque convocada: aviso algo más largo, dos tonos.
export function playMeetingSound() {
  if (!isSoundEnabled()) return;
  beep(400, 160);
  beep(300, 200, 160);
}
