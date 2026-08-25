const TYPES = ["dorado", "rojo", "negro", "blanco", "azul", "marron", "verde", "naranja"] as const;

interface SpecialSpinnerProps {
  size?: number;
}

export default function SpecialSpinner({ size = 84 }: SpecialSpinnerProps) {
  const radius = size / 2 - size * 0.16;
  const center = size / 2;
  const iconSize = size * 0.3;
  const duration = 1.6; // segundos, una vuelta completa

  return (
    <div className="special-spinner" style={{ width: size, height: size }}>
      {TYPES.map((type, i) => {
        const angle = (i / TYPES.length) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - iconSize / 2;
        const y = center + radius * Math.sin(angle) - iconSize / 2;
        const delay = -(duration * (i / TYPES.length));
        return (
          <img
            key={type}
            src={`/assets/ducks/pato_${type}.png`}
            alt=""
            className="special-spinner-icon"
            style={{
              width: iconSize,
              height: iconSize,
              left: x,
              top: y,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
