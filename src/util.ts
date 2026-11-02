import { useEffect, useState } from 'react';
import { DIAS, type Dia, type Pedido, type Resultado } from './types';

export const ZONA_BOLIVIA = 'America/La_Paz';
export const ZONA_JAPON = 'Asia/Tokyo';

/** Día de la semana actual en Japón, sin tildes. Domingo cae en lunes. */
export function diaDeHoy(): Dia {
  const nombre = new Intl.DateTimeFormat('es', { weekday: 'long', timeZone: ZONA_JAPON })
    .format(new Date())
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return DIAS.find((d) => d.id === nombre)?.id ?? 'lunes';
}

export function largoDe(dia: Dia): string {
  return DIAS.find((d) => d.id === dia)?.largo ?? dia;
}

/** "jue 29 oct" */
export function fechaEn(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: zona,
  })
    .format(fecha)
    .replace(/[.,]/g, '')
    .trim();
}

/** "21:30" */
export function horaEn(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: zona,
  }).format(fecha);
}

/** Filas de detalle de la tarjeta, en orden. Las filas sin datos no se incluyen. */
export function filasDetalle(p: Pedido): string[] {
  const unir = (...partes: (string | false)[]) => partes.filter(Boolean).join(' · ');
  return [
    unir(p.anio && `Año: ${p.anio}`, p.grado && `Grado: ${p.grado}`),
    p.km && `Km: ${p.km}`,
    p.puntaje && `Puntaje: ${p.puntaje}`,
    p.subasta && `Subastas: ${p.subasta}`,
    p.color && `Color: ${p.color}`,
    p.precio && `Precio: ${p.precio}`,
  ].filter(Boolean) as string[];
}

const CAMPOS_DATO_RES: (keyof Resultado)[] = [
  'lote',
  'subasta',
  'chasis',
  'anio',
  'grado',
  'km',
  'color',
  'puntaje',
  'precio',
];

const esCeroOVacio = (s: string | undefined) => {
  const t = (s ?? '').trim();
  return t === '' || /^0+(\.0+)?$/.test(t);
};

/** True si la fila tiene datos reales; false si todos los campos (salvo modelo) son 0 o vacíos. */
export function esResultadoValido(r: Resultado): boolean {
  return CAMPOS_DATO_RES.some((c) => !esCeroOVacio(r[c]));
}

export interface ResumenResultados {
  total: number;
  porModelo: { modelo: string; cantidad: number }[];
  validos: Resultado[];
  ultimaHora: string | null;
}

/** Arma el resumen (total y conteo por coche, incluidos los de 0 coincidencias) y filtra las filas reales. */
export function armarResumenResultados(items: Resultado[]): ResumenResultados {
  const mapa = new Map<string, number>();
  const validos: Resultado[] = [];
  let ultimaIso = '';

  for (const r of items) {
    const modelo = (r.modelo || '').trim() || 'Sin modelo';
    if (!mapa.has(modelo)) mapa.set(modelo, 0);
    if (esResultadoValido(r)) {
      mapa.set(modelo, (mapa.get(modelo) ?? 0) + 1);
      validos.push(r);
    }
    if (r.recibido && r.recibido > ultimaIso) ultimaIso = r.recibido;
  }

  let ultimaHora: string | null = null;
  if (ultimaIso) {
    const t = Date.parse(ultimaIso);
    if (!Number.isNaN(t)) {
      const f = new Date(t);
      ultimaHora = `${fechaEn(f, ZONA_JAPON)} ${horaEn(f, ZONA_JAPON)} (hora Japón)`;
    }
  }

  return {
    total: validos.length,
    porModelo: Array.from(mapa.entries()).map(([modelo, cantidad]) => ({ modelo, cantidad })),
    validos,
    ultimaHora,
  };
}

const escaparCSV = (s: string) => {
  const texto = (s ?? '').replace(/\r?\n/g, ' ').trim();
  if (/[",;]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
};

/** Descarga un archivo CSV con BOM UTF-8 con las 10 columnas (Modelo primero). */
export function descargarResultadosCSV(items: Resultado[], nombre: string): void {
  const cabeceras = [
    'Modelo',
    'Lote',
    'Subastas',
    'Chasis',
    'Año',
    'Grado',
    'km',
    'Color',
    'Puntaje',
    'Precio inicial',
  ];
  const filas = items.map((r) =>
    [r.modelo, r.lote, r.subasta, r.chasis, r.anio, r.grado, r.km, r.color, r.puntaje, r.precio]
      .map(escaparCSV)
      .join(','),
  );
  const contenido = '\uFEFF' + [cabeceras.join(','), ...filas].join('\r\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const alCambiar = () => setCoincide(m.matches);
    m.addEventListener('change', alCambiar);
    return () => m.removeEventListener('change', alCambiar);
  }, [consulta]);
  return coincide;
}
