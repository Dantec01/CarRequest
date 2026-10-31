import { useState, type FormEvent } from 'react';
import { CAMPOS, DIAS, type Campo, type DatosPedido, type Dia, type Pedido } from '../types';
import Hoja from './Hoja';
import { IconCerrar, IconMas } from './Iconos';

export type DiaOTodos = Dia | 'todos';

const MAX_CAJAS = 10;

const ETIQUETAS: Record<Campo, string> = {
  modelo: 'Modelo',
  subasta: 'Subasta',
  chasis: 'Chasis',
  anio: 'Año',
  grado: 'Grado',
  km: 'Km',
  color: 'Color',
  puntaje: 'Puntaje',
  precio: 'Precio',
  nota: 'Nota',
};

const AYUDA: Partial<Record<Campo, string>> = {
  modelo: 'ej. Toyota Yaris',
  subasta: 'ej. TAA Chubu',
  chasis: 'uno o varios, separados por comas',
  anio: 'ej. 2018-2022',
  grado: 'ej. G, X, S',
  km: 'ej. 80000 - 90000',
  puntaje: 'ej. 3, 3.5 o 3 - 5',
  precio: 'ej. 68 - 70.5',
};

const entrada =
  'h-11 w-full rounded-[10px] border border-borde2 bg-white px-2.5 text-[15px] text-tinta focus:border-acento focus:outline-none';

const botonCaja =
  'fx-btn fx-btn--secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-borde2 bg-white';

const limpiar = (s: string) => s.trim().replace(/\s+/g, ' ');
const partir = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

/** Una caja de texto más otras que se agregan con "+" y se quitan con "×". */
function Cajas({
  etiqueta,
  valores,
  placeholder,
  puedeAgregar,
  pie,
  onCambiar,
  onAgregar,
  onQuitar,
}: {
  etiqueta: string;
  valores: string[];
  placeholder?: string;
  puedeAgregar: boolean;
  pie: string;
  onCambiar: (i: number, valor: string) => void;
  onAgregar: () => void;
  onQuitar: (i: number) => void;
}) {
  const minusculas = etiqueta.toLowerCase();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-suave">{etiqueta}</span>
      {valores.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={v}
            onChange={(e) => onCambiar(i, e.target.value)}
            placeholder={placeholder}
            aria-label={i === 0 ? etiqueta : `${etiqueta} ${i + 1}`}
            autoFocus={i > 0 && i === valores.length - 1}
            className={entrada}
          />
          {i === 0 && puedeAgregar && (
            <button
              type="button"
              onClick={onAgregar}
              disabled={valores.length >= MAX_CAJAS}
              aria-label={`Agregar otro ${minusculas}`}
              title={`Agregar otro ${minusculas}`}
              className={`${botonCaja} text-acento disabled:opacity-40`}
            >
              <IconMas className="h-5 w-5" />
            </button>
          )}
          {i > 0 && (
            <button
              type="button"
              onClick={() => onQuitar(i)}
              aria-label={`Quitar ${minusculas} ${i + 1}`}
              title={`Quitar este ${minusculas}`}
              className={`${botonCaja} text-peligro`}
            >
              <IconCerrar />
            </button>
          )}
        </div>
      ))}
      {valores.length > 1 && <p className="text-xs text-suave">{pie}</p>}
    </div>
  );
}

export default function Formulario({
  inicial,
  diaInicial,
  guardando,
  onGuardar,
  onCerrar,
}: {
  inicial?: Pedido;
  diaInicial: Dia;
  guardando: boolean;
  /** Siempre un solo elemento: varios modelos se guardan juntos, uno por línea. */
  onGuardar: (dia: DiaOTodos, items: DatosPedido[]) => void;
  onCerrar: () => void;
}) {
  const [dia, setDia] = useState<DiaOTodos>(inicial?.dia ?? diaInicial);
  const [modelos, setModelos] = useState<string[]>(() => {
    const lista = (inicial?.modelo ?? '').split('\n');
    return lista.length > 0 ? lista : [''];
  });
  const [subastas, setSubastas] = useState<string[]>(() => {
    const lista = partir(inicial?.subasta ?? '');
    return lista.length > 0 ? lista : [''];
  });
  const [datos, setDatos] = useState<DatosPedido>(
    () => Object.fromEntries(CAMPOS.map((c) => [c, inicial?.[c] ?? ''])) as DatosPedido,
  );

  const cambiar = (campo: Campo, valor: string) => setDatos((d) => ({ ...d, [campo]: valor }));

  const lista = modelos.map(limpiar).filter(Boolean);
  const subasta = subastas.map(limpiar).filter(Boolean).join(', ');
  const vacio =
    lista.length === 0 &&
    subasta === '' &&
    CAMPOS.every((c) => c === 'modelo' || c === 'subasta' || datos[c].trim() === '');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (vacio) return;
    const base = Object.fromEntries(
      CAMPOS.map((c) => [c, c === 'nota' ? datos[c].trim() : limpiar(datos[c])]),
    ) as DatosPedido;
    // Varios modelos van en una sola tarjeta, uno por línea.
    onGuardar(dia, [{ ...base, modelo: lista.join('\n'), subasta }]);
  };

  const etiquetaBoton = guardando
    ? 'Guardando…'
    : vacio
      ? 'Llena al menos un dato'
      : 'Guardar pedido';

  const campo = (c: Campo) => (
    <label key={c} className="flex flex-col gap-1 text-xs text-suave">
      {ETIQUETAS[c]}
      <input
        value={datos[c]}
        onChange={(e) => cambiar(c, e.target.value)}
        placeholder={AYUDA[c]}
        className={entrada}
      />
    </label>
  );

  return (
    <Hoja titulo={inicial ? 'Editar pedido' : 'Nuevo pedido'} onCerrar={onCerrar} completa>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs text-suave">
          Para el día
          <select
            value={dia}
            onChange={(e) => setDia(e.target.value as DiaOTodos)}
            className={`${entrada} select-flecha`}
          >
            {!inicial && <option value="todos">Todos los días</option>}
            {DIAS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.largo}
              </option>
            ))}
          </select>
        </label>

        <Cajas
          etiqueta="Modelo"
          valores={modelos}
          placeholder={AYUDA.modelo}
          puedeAgregar
          pie="Se guardarán juntos en el mismo pedido, uno debajo de otro."
          onCambiar={(i, v) => setModelos((l) => l.map((m, j) => (j === i ? v : m)))}
          onAgregar={() => setModelos((l) => [...l, ''])}
          onQuitar={(i) => setModelos((l) => l.filter((_, j) => j !== i))}
        />

        <Cajas
          etiqueta="Subasta"
          valores={subastas}
          placeholder={AYUDA.subasta}
          puedeAgregar
          pie="Se guardarán juntas en el mismo pedido, separadas por comas."
          onCambiar={(i, v) => setSubastas((l) => l.map((s, j) => (j === i ? v : s)))}
          onAgregar={() => setSubastas((l) => [...l, ''])}
          onQuitar={(i) => setSubastas((l) => l.filter((_, j) => j !== i))}
        />

        {campo('chasis')}

        <div className="grid grid-cols-2 gap-2.5">
          {campo('anio')}
          {campo('grado')}
          {campo('km')}
          {campo('color')}
          {campo('puntaje')}
          {campo('precio')}
        </div>

        <p className="text-xs text-suave">
          Varios valores: sepáralos con coma y espacio (3, 3.5, 4). Rangos: 80000 - 90000. Usa punto
          para los decimales.
        </p>

        <label className="flex flex-col gap-1 text-xs text-suave">
          {ETIQUETAS.nota}
          <textarea
            value={datos.nota}
            onChange={(e) => cambiar('nota', e.target.value)}
            rows={3}
            className="w-full rounded-[10px] border border-borde2 bg-white p-2.5 text-[15px] text-tinta focus:border-acento focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={guardando || vacio}
          className="fx-btn fx-btn--primary fx-btn--shine min-h-[52px] rounded-xl bg-acento text-base font-bold text-white disabled:opacity-60"
        >
          {etiquetaBoton}
        </button>
      </form>
    </Hoja>
  );
}
