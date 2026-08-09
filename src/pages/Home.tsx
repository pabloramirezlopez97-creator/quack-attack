import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="screen center">
      <img
        src="/assets/branding/logo.png"
        alt="Quack Attack"
        className="logo-img"
      />

      <p className="muted" style={{ marginTop: 18, maxWidth: 320 }}>
        Complemento digital opcional para tu juego físico. El reglamento
        de patos manda siempre.
      </p>

      <div className="stack" style={{ marginTop: 36 }}>
        <button className="btn btn-primary" onClick={() => nav("/crear")}>
          🦆 CREAR PARTIDA
        </button>
        <button className="btn btn-secondary" onClick={() => nav("/unirse")}>
          UNIRSE A PARTIDA
        </button>
      </div>

      <img
        src="/assets/ducks/pato_explorador.png"
        alt=""
        className="mascot-corner"
      />
    </div>
  );
}
