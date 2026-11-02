import { DIAS, type Dia, type Pedido, type Resultado } from '../types';
import { armarResumenResultados, descargarResultadosCSV, diaDeHoy, largoDe } from '../util';
import { IconCerrar, IconDescargar, IconMas } from './Iconos';
import Tarjeta, { type AccionesTarjeta } from './Tarjeta';

export default function Tablero({
  pedidos,
  resultados,
  hoy,
  viendoResultados,
  acciones,
  deshabilitado,
  onNuevo,
  onCerrarResultados,
}: {
  pedidos: Pedido[];
  resultados: Resultado[];
  hoy: Dia;
  viendoResultados: boolean;
  acciones: AccionesTarjeta;
  deshabilitado: boolean;
  onNuevo: (dia: Dia) => void;
  onCerrarResultados: () => void;
}) {
  if (viendoResultados) {
    return (
      <main className="px-6 pb-8">
        <PanelResultadosPC resultados={resultados} onCerrar={onCerrarResultados} />
      </main>
    );
  }

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

function PanelResultadosPC({
  resultados,
  onCerrar,
}: {
  resultados: Resultado[];
  onCerrar: () => void;
}) {
  const { total, porModelo, validos, ultimaHora } = armarResumenResultados(resultados);
  const diaId = resultados[0]?.dia ?? diaDeHoy();
  const diaEtiqueta = resultados[0]?.dia ? ` · ${largoDe(resultados[0].dia)}` : '';

  return (
    <div className="flex flex-col gap-4">
      {/* En lugar de la fila de días de la semana va el cuadro de resumen */}
      <section aria-label="Resumen de coincidencias" className="rounded-xl border border-borde bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Resumen de coincidencias{diaEtiqueta}</h2>
            {ultimaHora && <p className="text-xs text-suave">Generado {ultimaHora}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={validos.length === 0}
              onClick={() => descargarResultadosCSV(validos, `${diaId}_resultados`)}
              className="fx-btn fx-btn--secondary fx-btn--shine flex h-9 items-center gap-1.5 rounded-[10px] border border-borde2 bg-white px-3 text-sm font-bold text-acento disabled:opacity-50"
            >
              <span className={validos.length > 0 ? 'fxc fxc-ping' : 'inline-flex'}>
                <IconDescargar className="h-4 w-4" />
              </span>
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar resultados y volver a pedidos"
              title="Volver a pedidos"
              className="fx-btn fx-btn--secondary fx-btn--shine flex h-9 w-9 items-center justify-center rounded-[10px] border border-borde2 bg-white text-tinta"
            >
              <IconCerrar />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-lg bg-acento-claro px-3 py-1.5">
            <span className="text-acento">Total coincidencias</span>
            <b className="text-acento">{total}</b>
          </div>
          {porModelo.map((m) => (
            <div
              key={m.modelo}
              className="flex items-center gap-2 rounded-lg border border-borde bg-fondo px-3 py-1.5"
            >
              <span className="text-suave">{m.modelo}</span>
              <b className={m.cantidad === 0 ? 'text-suave' : 'text-tinta'}>{m.cantidad}</b>
            </div>
          ))}
        </div>
      </section>

      {/* Tabla de resultados debajo */}
      <section aria-label="Tabla de resultados" className="rounded-xl border border-borde bg-white p-3">
        {validos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#8A96A3] p-4 text-sm text-suave">
            {resultados.length === 0
              ? 'Aún no hay resultados recibidos.'
              : 'No se encontraron coincidencias que pasaran los filtros.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#1B2A4A] text-white">
                  <th className="p-2 font-bold">Modelo</th>
                  <th className="p-2 font-bold">Lote</th>
                  <th className="p-2 font-bold">Subastas</th>
                  <th className="p-2 font-bold">Chasis</th>
                  <th className="p-2 font-bold">Año</th>
                  <th className="p-2 font-bold">Grado</th>
                  <th className="p-2 font-bold">Km</th>
                  <th className="p-2 font-bold">Color</th>
                  <th className="p-2 font-bold">Puntaje</th>
                  <th className="p-2 font-bold">Precio inicial</th>
                </tr>
              </thead>
              <tbody>
                {validos.map((r, i) => (
                  <tr
                    key={`${r.modelo}-${r.lote}-${r.subasta}-${i}`}
                    className={i < validos.length - 1 ? 'border-b border-borde' : ''}
                  >
                    <td className="p-2 font-bold">{r.modelo}</td>
                    <td className="p-2">{r.lote}</td>
                    <td className="p-2">{r.subasta}</td>
                    <td className="p-2">{r.chasis}</td>
                    <td className="p-2">{r.anio}</td>
                    <td className="p-2">{r.grado}</td>
                    <td className="p-2">{r.km}</td>
                    <td className="p-2">{r.color}</td>
                    <td className="p-2">{r.puntaje}</td>
                    <td className="p-2 font-bold">{r.precio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
