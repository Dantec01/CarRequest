import { useEffect } from 'react';
import { type Resultado } from '../types';
import { armarResumenResultados, descargarResultadosCSV, diaDeHoy, largoDe } from '../util';
import { IconCerrar, IconDescargar } from './Iconos';

/** Vista de resultados a pantalla completa para móvil (vista 2 del mockup). */
export default function VistaResultados({
  resultados,
  onCerrar,
}: {
  resultados: Resultado[];
  onCerrar: () => void;
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const { total, porModelo, validos, ultimaHora } = armarResumenResultados(resultados);
  const diaId = resultados[0]?.dia ?? diaDeHoy();
  const diaEtiqueta = resultados[0]?.dia ? ` · ${largoDe(resultados[0].dia)}` : '';

  return (
    <div className="ios-sheet fixed inset-0 z-40 h-dvh w-full overflow-y-auto bg-fondo px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Resultados{diaEtiqueta}</h2>
          {ultimaHora && <p className="text-xs text-suave">Generado {ultimaHora}</p>}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          title="Cerrar"
          className="fx-btn fx-btn--secondary fx-btn--shine flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-borde2 bg-white text-tinta"
        >
          <IconCerrar />
        </button>
      </div>

      {/* Botón Descargar Excel encima del cuadro de resumen */}
      <div className="mb-3 flex gap-2 text-sm">
        <button
          type="button"
          disabled={validos.length === 0}
          onClick={() => descargarResultadosCSV(validos, `${diaId}_resultados`)}
          className="fx-btn fx-btn--secondary fx-btn--shine flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-borde2 bg-white px-3 py-2 font-bold text-acento disabled:opacity-50"
        >
          <span className={validos.length > 0 ? 'fxc fxc-ping' : 'inline-flex'}>
            <IconDescargar className="h-4 w-4" />
          </span>
          Descargar Excel
        </button>
      </div>

      {/* Cuadro de resumen armado por la web: total de coincidencias y desglose por modelo */}
      <div className="mb-3 rounded-xl border border-borde bg-white p-3 text-sm">
        <div className="flex justify-between font-bold text-tinta">
          <span>Total coincidencias</span>
          <span>{total}</span>
        </div>
        {porModelo.map((m) => (
          <div
            key={m.modelo}
            className={`mt-1 flex justify-between ${
              m.cantidad === 0 ? 'text-peligro' : 'text-suave'
            }`}
          >
            <span>{m.modelo}</span>
            <span>{m.cantidad}</span>
          </div>
        ))}
      </div>

      {validos.length === 0 ? (
        <div
          className={`rounded-xl border border-dashed p-4 text-sm ${
            resultados.length > 0
              ? 'parpadeo-cero border-peligro/50 bg-[#FBE3E0]/40 text-peligro'
              : 'border-[#8A96A3] text-suave'
          }`}
        >
          {resultados.length === 0
            ? 'Aún no hay resultados recibidos.'
            : 'No se encontraron coincidencias que pasaran los filtros.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {validos.map((r, i) => (
            <TarjetaResultado key={`${r.modelo}-${r.lote}-${r.subasta}-${i}`} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaResultado({ r }: { r: Resultado }) {
  const loteChasis = [r.lote && `Lote ${r.lote}`, r.chasis].filter(Boolean).join(' · ');
  const l1 = [r.anio && `Año: ${r.anio}`, r.grado && `Grado: ${r.grado}`].filter(Boolean).join(' · ');
  const l2 = [r.km && `Km: ${r.km}`, r.color && `Color: ${r.color}`].filter(Boolean).join(' · ');

  return (
    <article className="rounded-2xl border border-borde bg-white p-3">
      <b className="text-base">{r.modelo || loteChasis || 'Resultado'}</b>
      {r.modelo && loteChasis && <div className="text-sm font-bold text-acento">{loteChasis}</div>}
      {r.subasta && <div className="text-xs text-suave">{r.subasta}</div>}
      {l1 && <div className="mt-1 text-sm">{l1}</div>}
      {l2 && <div className="text-sm">{l2}</div>}
      {r.puntaje && <div className="text-sm">Puntaje: {r.puntaje}</div>}
      {r.precio && (
        <div className="mt-1 text-sm">
          <b>Precio inicial: {r.precio}</b>
        </div>
      )}
    </article>
  );
}
