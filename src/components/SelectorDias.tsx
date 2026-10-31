import { useState } from 'react';
import { DIAS, type Dia, type Pedido } from '../types';
import Hoja from './Hoja';

export default function SelectorDias({
  pedido,
  guardando,
  onCopiar,
  onCerrar,
}: {
  pedido: Pedido;
  guardando: boolean;
  onCopiar: (dias: Dia[]) => void;
  onCerrar: () => void;
}) {
  const [elegidos, setElegidos] = useState<Dia[]>([]);

  const alternar = (dia: Dia) =>
    setElegidos((actual) =>
      actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia],
    );

  return (
    <Hoja titulo="Copiar a otro día" onCerrar={onCerrar}>
      <p className="mb-3 text-sm text-suave">
        {pedido.modelo || 'Este pedido'} se copiará a los días que marques.
      </p>
      <div className="flex flex-col">
        {DIAS.filter((d) => d.id !== pedido.dia).map((d) => (
          <label key={d.id} className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="checkbox"
              checked={elegidos.includes(d.id)}
              onChange={() => alternar(d.id)}
              className="h-5 w-5 accent-acento"
            />
            {d.largo}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={guardando || elegidos.length === 0}
        onClick={() => onCopiar(elegidos)}
        className="fx-btn fx-btn--primary fx-btn--shine mt-4 min-h-[52px] w-full rounded-xl bg-acento text-base font-bold text-white disabled:opacity-50"
      >
        {guardando ? 'Copiando…' : 'Copiar'}
      </button>
    </Hoja>
  );
}
