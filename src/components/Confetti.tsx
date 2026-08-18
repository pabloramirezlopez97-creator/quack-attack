import { useEffect, useState } from "react";

const COLORS = ["#f5c518", "#f5a623", "#4bbf7a", "#4a90d9", "#e15b5b", "#b06ad9"];

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

export default function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const generated: Piece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.2,
      rotation: Math.random() * 360,
    }));
    setPieces(generated);
    const timeout = setTimeout(() => setPieces([]), 3800);
    return () => clearTimeout(timeout);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
