import type { ReactNode } from 'react';
import Relojes from './Relojes';
import Rueda from './Rueda';
import { IconActualizar } from './Iconos';

export default function Cabecera({
  onActualizar,
  cargando,
  ultima,
  acciones,
}: {
  onActualizar: () => void;
  cargando: boolean;
  ultima: Date | null;
  acciones?: ReactNode;
}) {
  const hora = ultima
    ? ultima.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : null;

  const estado = hora && (
    <p className="text-right text-[11px] leading-tight text-suave md:text-xs">
      Actualizado a las
      <br className="md:hidden" /> {hora}
    </p>
  );

  return (
    <header className="px-5 pb-3 pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8 md:pt-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="mr-auto">
          <div className="flex items-center gap-2.5">
            <Rueda />
            <h1 className="bg-gradient-to-r from-[#23262B] from-30% to-[#1F5A9E] to-70% bg-clip-text text-2xl font-bold leading-tight tracking-tight text-transparent md:text-[26px]">
              CarRequest
            </h1>
          </div>
          <p className="hidden pl-[58px] text-sm text-suave md:block">
            Tablero semanal · se repite cada semana
          </p>
        </div>
        <div className="order-3 flex w-full gap-2.5 md:order-2 md:w-auto md:items-center">
          {estado && <div className="hidden md:block">{estado}</div>}
          <Relojes />
        </div>
        <div className="order-2 flex items-center gap-2 md:order-3">
          {estado && <div className="md:hidden">{estado}</div>}
          {acciones}
          <button
            type="button"
            onClick={onActualizar}
            disabled={cargando}
            aria-label="Actualizar"
            title="Actualizar"
            className="fx-btn fx-btn--secondary fx-btn--shine flex h-11 items-center gap-2 rounded-[10px] border border-borde2 bg-white px-3 text-sm font-bold text-acento disabled:opacity-60 md:px-4"
          >
            <IconActualizar girando={cargando} />
            <span className="hidden md:inline">{cargando ? 'Actualizando…' : 'Actualizar'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
