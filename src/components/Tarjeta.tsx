import type { Pedido } from '../types';
import { filasDetalle } from '../util';
import { IconCopiarDia, IconCopiarSemana, IconEditar, IconEliminar } from './Iconos';

export interface AccionesTarjeta {
  editar: (p: Pedido) => void;
  copiarDia: (p: Pedido) => void;
  copiarSemana: (p: Pedido) => void;
  eliminar: (p: Pedido) => void;
}

const UNA_HORA = 60 * 60 * 1000;

/** Agregado (o modificado) hace menos de una hora, según la columna `actualizado`. */
const esNuevo = (p: Pedido) => {
  const t = Date.parse(p.actualizado);
  return !Number.isNaN(t) && Date.now() - t < UNA_HORA;
};

const boton =
  'flex h-11 w-11 items-center justify-center rounded-lg text-suave transition-colors hover:bg-acento-claro hover:text-acento disabled:opacity-40 md:h-9 md:w-9';

export default function Tarjeta({
  pedido,
  acciones,
  deshabilitado,
}: {
  pedido: Pedido;
  acciones: AccionesTarjeta;
  deshabilitado: boolean;
}) {
  const filas = filasDetalle(pedido);
  return (
    <article className="overflow-hidden rounded-[14px] border border-borde bg-white md:rounded-xl">
      <div className="flex flex-col gap-1 px-3.5 pb-2.5 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            {(pedido.modelo ? pedido.modelo.split('\n') : ['Sin modelo']).map((m, i) => (
              <h3 key={i} className="text-base font-bold md:text-sm">
                {m}
              </h3>
            ))}
          </div>
          {esNuevo(pedido) && (
            <span className="shrink-0 rounded-full bg-[#DDF3E4] px-2 py-0.5 text-[11px] font-bold text-[#1E7A3C]">
              Nuevo
            </span>
          )}
        </div>
        {pedido.chasis && <div className="text-[13px] text-suave md:text-xs">{pedido.chasis}</div>}
        {filas.map((fila) => (
          <div key={fila} className="text-sm md:text-xs">
            {fila}
          </div>
        ))}
        {pedido.nota && (
          <div className="text-[13px] text-suave md:text-xs">Nota: {pedido.nota}</div>
        )}
      </div>
      <div className="flex border-t border-borde px-1">
        <button
          type="button"
          className={boton}
          aria-label="Editar"
          title="Editar"
          disabled={deshabilitado}
          onClick={() => acciones.editar(pedido)}
        >
          <IconEditar />
        </button>
        <button
          type="button"
          className={boton}
          aria-label="Copiar a otro día"
          title="Copiar a otro día"
          disabled={deshabilitado}
          onClick={() => acciones.copiarDia(pedido)}
        >
          <IconCopiarDia />
        </button>
        <button
          type="button"
          className={boton}
          aria-label="Copiar a toda la semana"
          title="Copiar a toda la semana"
          disabled={deshabilitado}
          onClick={() => acciones.copiarSemana(pedido)}
        >
          <IconCopiarSemana />
        </button>
        <button
          type="button"
          className={`${boton} !text-peligro hover:!bg-[#FBE3E0]`}
          aria-label="Eliminar"
          title="Eliminar"
          disabled={deshabilitado}
          onClick={() => acciones.eliminar(pedido)}
        >
          <IconEliminar />
        </button>
      </div>
    </article>
  );
}
