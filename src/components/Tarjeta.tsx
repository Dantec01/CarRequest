import type { Pedido } from '../types';
import { resumen } from '../util';
import { IconCopiarDia, IconCopiarSemana, IconEditar, IconEliminar } from './Iconos';

export interface AccionesTarjeta {
  editar: (p: Pedido) => void;
  copiarDia: (p: Pedido) => void;
  copiarSemana: (p: Pedido) => void;
  eliminar: (p: Pedido) => void;
}

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
  const { l1, l2 } = resumen(pedido);
  return (
    <article className="overflow-hidden rounded-[14px] border border-borde bg-white md:rounded-xl">
      <div className="flex flex-col gap-1 px-3.5 pb-2.5 pt-3">
        <h3 className="text-base font-bold md:text-sm">{pedido.modelo || 'Sin modelo'}</h3>
        {pedido.chasis && <div className="text-[13px] text-suave md:text-xs">{pedido.chasis}</div>}
        {l1 && <div className="text-sm md:text-xs">{l1}</div>}
        {l2 && <div className="text-sm md:text-xs">{l2}</div>}
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
