import { useEffect, useState } from 'react';
import { DIAS, type Dia, type Pedido } from './types';

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

const limpiar = (s: string) => s.replace(/[\t\r\n]+/g, ' ');

/** TSV sin fila de cabecera, listo para pegar en Sheets. */
export function aTSV(items: Pedido[], conDia: boolean): string {
  return items
    .map((p) => {
      const cols = [
        p.modelo,
        p.subasta,
        p.chasis,
        p.anio,
        p.grado,
        p.km,
        p.color,
        p.puntaje,
        p.precio,
        p.nota,
      ];
      if (conDia) cols.unshift(largoDe(p.dia));
      return cols.map((c, i) => limpiar(i === (conDia ? 1 : 0) ? c.replace(/\n+/g, ', ') : c)).join('\t');
    })
    .join('\n');
}

export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
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
