import { DIAS, type Dia, type Pedido } from '../types';
import { IconMas } from './Iconos';
import Tarjeta, { type AccionesTarjeta } from './Tarjeta';

export default function Tablero({
  pedidos,
  hoy,
  acciones,
  deshabilitado,
  onNuevo,
}: {
  pedidos: Pedido[];
  hoy: Dia;
  acciones: AccionesTarjeta;
  deshabilitado: boolean;
  onNuevo: (dia: Dia) => void;
}) {
  return (
    <main className="overflow-x-auto px-6 pb-8">
      {/* Todas las columnas llevan el mismo relleno; "hoy" solo cambia el fondo,
          así las cabeceras y las tarjetas quedan alineadas entre días. */}
      <div className="grid grid-cols-[repeat(6,minmax(200px,1fr))] items-start">
        {DIAS.map((d) => {
          const delDia = pedidos.filter((p) => p.dia === d.id);
          const esHoy = d.id === hoy;
          return (
            <section
              key={d.id}
              aria-label={d.largo}
              className={`flex flex-col gap-3 rounded-[14px] p-2 ${esHoy ? 'bg-acento-claro' : ''}`}
            >
              <div
                className={`flex h-10 items-center justify-between border-b px-1 pb-2 ${
                  esHoy ? 'border-acento/30' : 'border-borde2'
                }`}
              >
                <h2
                  className={`min-w-0 whitespace-nowrap text-sm font-bold ${esHoy ? 'text-acento' : ''}`}
                >
                  {d.largo}
                  {esHoy && ' · hoy'}{' '}
                  <span className={`font-normal ${esHoy ? 'text-acento' : 'text-suave'}`}>
                    · {delDia.length}
                  </span>
                </h2>
                <button
                  type="button"
                  aria-label={`Agregar pedido el ${d.largo}`}
                  title="Agregar pedido"
                  onClick={() => onNuevo(d.id)}
                  className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-acento hover:bg-white"
                >
                  <IconMas className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {delDia.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#8A96A3] p-3 text-[13px] text-suave">
                    Sin pedidos
                  </div>
                )}
                {delDia.map((p) => (
                  <Tarjeta key={p.id} pedido={p} acciones={acciones} deshabilitado={deshabilitado} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
