# Quack Attack 🦆 — Fase 1 (Lobby)

Complemento digital **opcional** del juego físico Quack Attack.
El reglamento físico es siempre la fuente de verdad.

## Qué incluye esta fase

- Pantalla de inicio con el logo oficial
- Crear partida (elegir modo, nombre del Pato Jefe, código de sala generado automáticamente)
- Unirse a partida (código + nombre + rol: Pato Jefe o Pato Explorador)
- Sala de espera con lista de jugadores en tiempo real (Supabase Realtime)
- Base de datos y seguridad (RLS) ya configuradas en Supabase — nadie puede
  falsear otro jugador ni la puntuación, todo pasa por funciones validadas en el servidor.

## Cómo subir esto a GitHub desde el iPad

1. Abre tu repositorio `quack-attack` en Safari → **github.com** → tu repo.
2. Toca el punto (`.`) en el teclado, o ve a `github.dev/TU-USUARIO/quack-attack`
   (cambia la `.com` de la URL de tu repo por `.dev`). Esto abre un editor de código
   completo dentro del navegador.
3. En el panel izquierdo, usa **"Upload Files"** (icono de subir) o arrastra los
   archivos y carpetas de este proyecto (todos, incluida la carpeta `public/`,
   `src/`, y los archivos sueltos como `package.json`, `index.html`, `netlify.toml`, etc.)
4. Cuando termines, ve al icono de control de versiones (rama, en la barra lateral)
   → escribe un mensaje como "Fase 1: lobby" → **Commit & Push**.

## Cómo conectarlo a Netlify (solo la primera vez)

1. Entra en **app.netlify.com** → tu sitio **quack-attack** (ya está creado).
2. Ve a **Site configuration → Build & deploy → Continuous deployment**.
3. Toca **Link repository** (o "Link site to Git") → elige **GitHub** → autoriza
   → selecciona el repositorio `quack-attack`.
4. Netlify detectará automáticamente el comando de build (`npm run build`) y la
   carpeta `dist` gracias al archivo `netlify.toml` que ya está incluido.
5. Pulsa **Deploy**. En 1-2 minutos tu web estará en:
   **https://quack-attack.netlify.app**

A partir de aquí, cada vez que subas cambios nuevos a GitHub, Netlify
volverá a publicar la web sola, sin que tengas que tocar nada más en Netlify.

## Variables de entorno

Ya están configuradas en Netlify (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
Si alguna vez quieres probar el proyecto en tu ordenador con `npm run dev`,
copia `.env.example` como `.env`.

## Siguientes fases (pendientes)

- Fase 2: Panel del Pato Explorador (cuadrícula 10×10, registrar patos)
- Fase 3: Panel del Pato Jefe + los 8 Patos Especiales + Reuniones en la Charca
- Fase 4: Final de partida, recuento y clasificación
