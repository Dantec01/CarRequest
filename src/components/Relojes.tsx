import { useEffect, useState } from 'react';
import { ZONA_BOLIVIA, ZONA_JAPON, fechaEn, horaEn } from '../util';

const RELOJES = [
  { nombre: 'Japón', zona: ZONA_JAPON },
  { nombre: 'Bolivia', zona: ZONA_BOLIVIA },
];

/** Reloj local (no hace peticiones de red). */
export default function Relojes() {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {RELOJES.map((r) => (
        <div
          key={r.zona}
          className="flex-1 rounded-xl border border-borde bg-white px-3 py-2 md:flex-none md:py-1.5"
        >
          <div className="text-xs text-suave">
            {r.nombre} · {fechaEn(ahora, r.zona)}
          </div>
          <div className="text-xl font-bold md:text-base">{horaEn(ahora, r.zona)}</div>
        </div>
      ))}
    </>
  );
}
