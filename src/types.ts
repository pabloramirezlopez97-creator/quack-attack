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

// Imagen ilustrada propia de cada Pato Especial (mismo recurso gráfico que el Manual de Juego)
export const SPECIAL_IMAGE: Record<SpecialType, string> = {
  dorado: "/assets/ducks/pato dorado.png",
  rojo: "/assets/ducks/pato rojo.png",
  negro: "/assets/ducks/pato negro.png",
  blanco: "/assets/ducks/pato blanco.png",
  azul: "/assets/ducks/pato azul.png",
  marron: "/assets/ducks/pato marron.png",
  verde: "/assets/ducks/pato verde.png",
  naranja: "/assets/ducks/pato naranja.png",
};

export interface SpecialInfo {
  tipo: string;
  parrafos: string[];
}

// Texto de habilidad de cada Pato Especial — copiado literalmente del Manual de Juego (PDF A4)
export const SPECIAL_INFO: Record<SpecialType, SpecialInfo> = {
  dorado: {
    tipo: "Pasivo, no necesita activación.",
    parrafos: ["Suma +5 puntos al final."],
  },
  rojo: {
    tipo: "Pasivo, no necesita activación.",
    parrafos: ["Resta −5 puntos al final."],
  },
  blanco: {
    tipo: "Pasivo, se activa al instante al recibir un ataque.",
    parrafos: [
      "Defiéndete de un ataque de los Patos Negro, Verde y Marrón.",
      "Si el jugador que posee el Pato Blanco es atacado por otro Pato Especial, se revela al instante el escudo, bloquea el ataque y el Pato Blanco queda descartado automáticamente. El Pato Azul sí puede intercambiarlo.",
    ],
  },
  naranja: {
    tipo: "Activo, se reúne a solas con el Pato Jefe.",
    parrafos: [
      "Permite pedir una única pista al Pato Jefe para encontrar un único Pato Normal. Nunca puede señalar directamente un Pato Especial. Después de usarse se descarta.",
    ],
  },
  verde: {
    tipo: "Activo, necesita convocar Reunión en el Estanque.",
    parrafos: [
      "Permite realizar una única operación, comprar o vender.",
      "a) Comprar: Compra 1 Pato Especial de otro jugador a cambio de 3 Patos Normales propios.",
      "b) Vender: Vende 1 Pato Especial propio a otro jugador a cambio de 2 Patos Normales del jugador elegido.",
      "Puede vender cualquier Pato Especial, incluido el propio Pato Verde. Si vende el Verde, recibe 2 Patos Normales y el Verde pasa físicamente al comprador. La habilidad no se consume y podrá utilizarla el nuevo propietario.",
    ],
  },
  marron: {
    tipo: "Activo, necesita convocar Reunión en el Estanque.",
    parrafos: [
      "Impide que un jugador busque patos durante 30 segundos. Al terminar el Pato Marrón se descarta.",
    ],
  },
  negro: {
    tipo: "Activo, necesita convocar Reunión en el Estanque.",
    parrafos: [
      "Permite elegir entre robar el Pato de Oro o robar Patos Normales.",
      "a) Robar Pato de Oro: Elige a un jugador al que robar. Si acierta y tiene el Pato de Oro, pasará al atacante y el Pato Negro se descarta. Pero si falla y no lo tiene, se descarta.",
      "b) Robar Patos Normales: Primero escoge una cifra del 0 al 9 y después elige a un jugador al que robarle. A continuación podrá robar todos los Patos Normales del jugador, cuyo número termine en la cifra elegida. No puede robar el Pato Blanco, ya que bloquea el ataque del Pato Negro y lo anula, terminando la jugada y descartando el Pato Negro.",
    ],
  },
  azul: {
    tipo: "Activo y permanente. Necesita convocar una Reunión en el Estanque.",
    parrafos: [
      "Permite intercambiar o mover Patos Especiales sin ser visto. Tiene usos infinitos y nunca se descarta.",
      "En la Reunión en el Estanque convocada por el Pato Azul, todos los jugadores deben mantener los ojos cerrados hasta que concluya, excepto quien lo activa y el Pato Jefe. El jugador que lo activa debe elegir entre: a) Mover un Especial de un jugador a otro libremente. b) Intercambiar dos Especiales entre dos jugadores.",
      "El Pato Azul no puede ser intercambiado por otro. Después del movimiento o intercambio, pasa a ser propiedad de uno de los jugadores implicados, a elección de quien lo ha activado. Quien lo ha activado no puede quedárselo. El nuevo propietario podrá volver a utilizarlo.",
      "Puede mover o intercambiar cualquier Pato Especial (Dorado, Rojo, Negro, Blanco, Verde, Marrón o Naranja) excepto el propio Azul. El Pato Blanco no tiene efecto.",
    ],
  },
};

// Especiales ACTIVOS: requieren que su dueño decida activarlos (Reunión en el Estanque).
// Dorado, Rojo y Blanco son pasivos y nunca se activan.
export const ACTIVE_SPECIAL_TYPES: SpecialType[] = ["negro", "verde", "marron", "naranja", "azul"];

// Una fila de la tabla `meetings`. Cada Reunión en el Estanque es independiente:
// puede haber varias a la vez, cada una con su propio ciclo de vida.
export interface Meeting {
  id: string;
  game_id: string;
  special_type: SpecialType;
  special_id: string;
  player_id: string;
  player_name: string;
  resolution: string | null;
  hint_text: string | null;
  blocked_player_id: string | null;
  blocked_player_name: string | null;
  blocked_until: string | null;
  naranja_typing: boolean;
  called_at: string;
}

