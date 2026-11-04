import { DIAS, type Dia, type Pedido, type Resultado } from '../types';
import { esResultadoValido, largoDe } from '../util';
import { IconMas } from './Iconos';
import Tarjeta, { type AccionesTarjeta } from './Tarjeta';

export default function VistaDia({
  pedidos,
  resultados,
  diaSel,
  onDia,
  acciones,
  deshabilitado,
  onNuevo,
  onResultados,
}: {
  pedidos: Pedido[];
  resultados: Resultado[];
  diaSel: Dia;
  onDia: (dia: Dia) => void;
  acciones: AccionesTarjeta;
  deshabilitado: boolean;
  onNuevo: (dia: Dia) => void;
  onResultados: () => void;
}) {
  const delDia = pedidos.filter((p) => p.dia === diaSel);
  const totalCoincidencias = resultados.filter(esResultadoValido).length;

  return (
    <main className="pb-28">
      <div role="tablist" aria-label="Días de la semana" className="flex gap-2 px-5">
        {DIAS.map((d) => {
          const activo = d.id === diaSel;
          const cantidad = pedidos.filter((p) => p.dia === d.id).length;
          return (
            <button
              key={d.id}
              role="tab"
              type="button"
              aria-selected={activo}
              onClick={() => onDia(d.id)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border text-[15px] font-bold ${
                activo ? 'border-acento bg-acento text-white' : 'border-borde2 bg-white text-tinta hover:border-acento'
              }`}
            >
              {d.corto}
              <small className={`text-xs font-normal ${activo ? 'text-[#D6E4F4]' : 'text-suave'}`}>
                {cantidad}
              </small>
            </button>
          );
        })}
      </div>

      <div key={diaSel} className="ios-view mt-4 flex items-center justify-between px-5">
        <h2 className="text-lg font-bold">
          {largoDe(diaSel)}{' '}
          <span className="text-[13px] font-normal text-suave">
            · {delDia.length} {delDia.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </h2>
        <button
          type="button"
          onClick={onResultados}
          className="fx-btn fx-btn--secondary fx-btn--shine flex min-h-11 items-center gap-1.5 rounded-[10px] border border-borde2 bg-white px-3 text-sm font-bold text-acento"
        >
          Resultados
          {resultados.length > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold leading-none text-white ${
                totalCoincidencias > 0 ? 'bg-[#1E7A3C]' : 'bg-suave'
              }`}
            >
              {totalCoincidencias}
            </span>
          )}
        </button>
      </div>

      <div key={`lista-${diaSel}`} className="ios-view mt-2 flex flex-col gap-2.5 px-5">
        {delDia.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#8A96A3] p-4 text-sm text-suave">
            Sin pedidos para este día.
          </div>
        )}
        {delDia.map((p) => (
          <Tarjeta key={p.id} pedido={p} acciones={acciones} deshabilitado={deshabilitado} />
        ))}
      </div>

      <button
        type="button"
        aria-label="Nuevo pedido"
        onClick={() => onNuevo(diaSel)}
        className="fx-btn fx-btn--primary fx-btn--shine fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-acento text-white shadow-lg bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <IconMas className="h-6 w-6" />
      </button>
    </main>
  );
}
