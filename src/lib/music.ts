// Música de fondo generada con Web Audio API (sin archivos de audio).
// Suena en Inicio, Crear partida, Unirse y Sala de espera; se para al entrar
// en la partida (GamePlay), donde solo suenan los efectos.
import { isSoundEnabled } from "./sound";

const BPM = 112;
const STEP = 60 / BPM / 2; // corchea, en segundos

// Melodía: semitonos sobre Do5 (null = silencio). 4 compases de 8 corcheas.
const MELODY: (number | null)[] = [
  4, 7, 9, 7, 4, 2, 0, null,
  2, 4, 7, 4, 2, 0, -3, null,
  4, 7, 9, 12, 9, 7, 4, null,
  2, 4, 2, 0, 2, null, 0, null,
];
// Bajo: raíz y quinta de cada acorde (C, F, G, C), semitonos sobre Do3.
const BASS: (number | null)[] = [
  0, null, null, null, 7, null, null, null,
  5, null, null, null, 12, null, null, null,
  7, null, null, null, 14, null, null, null,
  0, null, null, null, 7, null, null, null,
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let wanted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = isSoundEnabled() ? 1 : 0;
    master.connect(ctx.destination);
  }
  return ctx;
}

function note(freq: number, when: number, dur: number, type: OscillatorType, vol: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function tick() {
  if (!ctx || !wanted) return;
  // Si el iPhone/iPad aún no ha dado permiso de audio, no programamos notas.
  if (ctx.state !== "running") {
    nextTime = ctx.currentTime + 0.1;
    return;
  }
  while (nextTime < ctx.currentTime + 0.4) {
    const i = step % MELODY.length;
    const m = MELODY[i];
    const b = BASS[i];
    if (m !== null) note(523.25 * Math.pow(2, m / 12), nextTime, STEP * 1.8, "triangle", 0.06);
    if (b !== null) note(130.81 * Math.pow(2, b / 12), nextTime, STEP * 3.5, "sine", 0.08);
    nextTime += STEP;
    step++;
  }
}

function unlock() {
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function onSoundChange() {
  if (master) master.gain.value = isSoundEnabled() ? 1 : 0;
}

export function startMusic() {
  if (wanted) return;
  const c = getCtx();
  if (!c) return;
  wanted = true;
  nextTime = c.currentTime + 0.1;
  step = 0;
  c.resume();
  // iOS exige un toque del usuario para empezar el audio: al primer toque arranca.
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("touchend", unlock);
  window.addEventListener("quackattack-sound-change", onSoundChange);
  onSoundChange();
  timer = window.setInterval(tick, 100);
}

export function stopMusic() {
  if (!wanted) return;
  wanted = false;
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  window.removeEventListener("pointerdown", unlock);
  window.removeEventListener("touchend", unlock);
  window.removeEventListener("quackattack-sound-change", onSoundChange);
}
