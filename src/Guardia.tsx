import { useRef, useState, type ReactNode } from 'react';

const CLICS_NECESARIOS = 10;

/**
 * Pantalla de "aplicación desactivada". Solo se ve el mensaje, sin aspecto de botón.
 * Pulsar 10 veces sobre el mensaje deja pasar a la app, solo hasta que se recargue la página
 * (no se guarda nada: en cada visita hay que volver a pulsar).
 * No es seguridad real: solo oculta la app a quien abra el enlace por casualidad.
 */
export default function Guardia({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const clics = useRef(0);

  if (abierto) return <>{children}</>;

  const alPulsar = () => {
    clics.current += 1;
    if (clics.current >= CLICS_NECESARIOS) setAbierto(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: '#ffffff',
        color: '#000000',
        textAlign: 'center',
      }}
    >
      <p
        onClick={alPulsar}
        style={{
          margin: 0,
          cursor: 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          fontSize: '1rem',
          lineHeight: 1.5,
        }}
      >
        This application has been deactivated due to inactivity; please contact your administrator.
      </p>
    </div>
  );
}
