import { useState } from "react";

export default function LegalFooter() {
  const [open, setOpen] = useState(false);

  return (
    <div className="legal-footer">
      <p className="legal-line">Diseñado, creado y desarrollado por Pablo Ramírez López.</p>
      <p className="legal-line">© Pablo Ramírez López — 2026 · Todos los derechos reservados</p>

      <button
        className="legal-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "▲" : "▼"} Aviso legal, Autoría y Derechos
      </button>

      {open && (
        <div className="legal-text">
          <p>
            Este juego, incluyendo su concepto, desarrollo creativo, diseño,
            sistema de juego, componentes físicos, identidad gráfica,
            documentación, contenidos y plataforma digital asociada, ha sido
            concebido, diseñado y desarrollado por Pablo Ramírez López.
          </p>
          <p>
            © Pablo Ramírez López — 2026
            <br />
            Todos los derechos reservados.
          </p>
          <p>
            Queda prohibida, sin autorización expresa y por escrito del
            autor, la reproducción, distribución, transformación,
            comercialización, comunicación pública o explotación, total o
            parcial, de las obras, diseños, textos, elementos gráficos,
            materiales y contenidos que integran este proyecto, por
            cualquier medio o formato.
          </p>
          <p>
            El presente aviso no limita los derechos que correspondan al
            autor conforme a la legislación aplicable en materia de
            propiedad intelectual y propiedad industrial.
          </p>
        </div>
      )}
    </div>
  );
}
