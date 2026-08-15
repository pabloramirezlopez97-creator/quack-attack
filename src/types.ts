export type Role = "jefe" | "explorador";

export type SpecialType =
  | "dorado"
  | "rojo"
  | "negro"
  | "blanco"
  | "azul"
  | "marron"
  | "verde"
  | "naranja";

export type GameStatus =
  | "lobby"
  | "preparacion"
  | "en_curso"
  | "reunion"
  | "finalizacion"
  | "recuento"
  | "resultados";

export interface Game {
  id: string;
  code: string;
  mode: 1 | 2 | 3;
  status: GameStatus;
  max_explorers: number;
  max_jefes: number;
  current_meeting: Record<string, unknown> | null;
  timer_ends_at: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface Player {
  id: string;
  game_id: string;
  session_id: string;
  name: string;
  role: Role;
  score: number;
  is_blocked_until: string | null;
  created_at: string;
}

export interface Duck {
  id: string;
  game_id: string;
  number: number;
  owner_id: string | null;
  found_at: string | null;
}

export interface SpecialDuck {
  id: string;
  game_id: string;
  type: SpecialType;
  owner_id: string | null;
  paired_duck_number: number | null;
  status: "hidden" | "held" | "discarded";
  used: boolean;
  ever_activated: boolean;
  found_at: string | null;
}

// Valores de puntuación — Reglamento Oficial, sección 14
export const SPECIAL_VALUES: Record<SpecialType, number> = {
  dorado: 5,
  rojo: -5,
  negro: 0,
  blanco: 0,
  azul: 0,
  marron: 0,
  verde: 0,
  naranja: 0,
};

// Penalización si un Especial Activo no se usó al finalizar — sección 10
export const UNUSED_PENALTY: Record<SpecialType, number> = {
  dorado: 0,
  rojo: 0,
  negro: -8,
  blanco: 0, // el Blanco nunca penaliza por no usarse
  azul: -8,
  marron: -8,
  verde: -8,
  naranja: -8,
};

export const SPECIAL_LABELS: Record<SpecialType, string> = {
  dorado: "Pato Dorado",
  rojo: "Pato Rojo",
  negro: "Pato Negro",
  blanco: "Pato Blanco",
  azul: "Pato Azul",
  marron: "Pato Marrón",
  verde: "Pato Verde",
  naranja: "Pato Naranja",
};

export const SPECIAL_EMOJI: Record<SpecialType, string> = {
  dorado: "🟡",
  rojo: "🔴",
  negro: "⚫",
  blanco: "⚪",
  azul: "🔵",
  marron: "🟤",
  verde: "🟢",
  naranja: "🟠",
};

// Color propio de cada Pato Especial, usado como fondo de su casilla
export const SPECIAL_COLORS: Record<SpecialType, string> = {
  dorado: "#f5c518",
  rojo: "#e15b5b",
  negro: "#2b2b33",
  blanco: "#f4f4f6",
  azul: "#4a90d9",
  marron: "#8b5e3c",
  verde: "#4bbf7a",
  naranja: "#f5a623",
};

// Especiales ACTIVOS: requieren que su dueño decida activarlos (Reunión en la Charca).
// Dorado, Rojo y Blanco son pasivos y nunca se activan.
export const ACTIVE_SPECIAL_TYPES: SpecialType[] = ["negro", "verde", "marron", "naranja", "azul"];

// Forma de games.current_meeting cuando hay una Reunión en la Charca activa.
export interface MeetingInfo {
  special_type: SpecialType;
  special_id: string;
  player_id: string;
  player_name: string;
  called_at: string;
  hint_text?: string;
  resolution?: string;
  blocked_player_id?: string;
  blocked_player_name?: string;
  blocked_until?: string;
  pending_blanco?: {
    blanco_special_id: string;
    target_player_id: string;
    target_player_name: string;
    choice: "dorado" | "normal";
    digit: number | null;
  };
}
