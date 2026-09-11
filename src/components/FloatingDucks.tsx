import { useEffect, useRef, useState } from 'react';

// Las 10 imágenes de pato que ya existen en el proyecto (8 Especiales + Explorador + Jefe).
// Se reutilizan tal cual, sin generar assets nuevos.
const DUCK_IMAGES = [
  '/assets/ducks/pato dorado.png',
  '/assets/ducks/pato rojo.png',
  '/assets/ducks/pato negro.png',
  '/assets/ducks/pato blanco.png',
  '/assets/ducks/pato azul.png',
  '/assets/ducks/pato marron.png',
  '/assets/ducks/pato verde.png',
  '/assets/ducks/pato naranja.png',
  '/assets/ducks/pato explorador.png',
  '/assets/ducks/pato jefe.png',
];

interface FloatingDuck {
  id: number;
  image: string;
  left: number; // posición horizontal, en % del contenedor
  size: number; // tamaño en px
  duration: number; // duración de la animación, en segundos
  delay: number; // retraso antes de empezar, en segundos
  drift: number; // desplazamiento horizontal leve durante el flotado, en px
}

let nextId = 0;

/**
 * Capa decorativa de fondo: patos que aparecen, flotan suavemente y se desvanecen,
 * en posiciones y tiempos aleatorios. Puramente visual — no interactúa con el juego
 * ni bloquea clics (pointer-events: none se aplica desde el CSS).
 */
export default function FloatingDucks() {
  const [ducks, setDucks] = useState<FloatingDuck[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Cuántos patos como máximo mostramos a la vez en pantalla, para no saturar.
    const MAX_CONCURRENT = 6;

    function spawnDuck() {
      if (cancelled) return;

      setDucks((current) => {
        if (current.length >= MAX_CONCURRENT) return current;

        const duck: FloatingDuck = {
          id: nextId++,
          image: DUCK_IMAGES[Math.floor(Math.random() * DUCK_IMAGES.length)],
          left: Math.random() * 90 + 2, // entre 2% y 92%, para no pegarse a los bordes
          size: Math.random() * 28 + 32, // entre 32px y 60px
          duration: Math.random() * 5 + 7, // entre 7s y 12s
          delay: 0,
          drift: Math.random() * 40 - 20, // entre -20px y +20px
        };

        // Autolimpieza: cuando termine su animación, se retira del array.
        window.setTimeout(() => {
          if (cancelled) return;
          setDucks((list) => list.filter((d) => d.id !== duck.id));
        }, (duck.duration + 0.5) * 1000);

        return [...current, duck];
      });

      // Programa la siguiente aparición en un intervalo aleatorio (entre 1.2s y 3.5s).
      const nextDelay = Math.random() * 2300 + 1200;
      window.setTimeout(spawnDuck, nextDelay);
    }

    // Arranque escalonado: los primeros patos no aparecen todos de golpe.
    const initialTimers = [0, 400, 900, 1500].map((t) =>
      window.setTimeout(spawnDuck, t)
    );

    return () => {
      cancelled = true;
      initialTimers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div className="floating-ducks" ref={containerRef} aria-hidden="true">
      {ducks.map((duck) => (
        <img
          key={duck.id}
          src={duck.image}
          alt=""
          className="floating-duck"
          style={{
            left: `${duck.left}%`,
            width: `${duck.size}px`,
            height: `${duck.size}px`,
            animationDuration: `${duck.duration}s`,
            // Variable CSS custom para el desplazamiento lateral aleatorio.
            // @ts-ignore - propiedad CSS personalizada, TypeScript no la conoce por defecto
            '--drift': `${duck.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
