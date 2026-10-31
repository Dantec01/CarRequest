import type { DatosPedido, Dia, Pedido } from './types';

/**
 * Único punto de acceso a los datos. Hoy habla con Google Apps Script (Sheets).
 * Si algún día cambia el almacenamiento, solo se toca este archivo.
 */

const API_URL = import.meta.env.VITE_API_URL;
const K_TOKEN = 'carrequest.token';
const K_CACHE = 'carrequest.cache';

export class ErrorNoAutorizado extends Error {}

export const hayApiConfigurada = Boolean(API_URL);

/** Lee el token guardado; si la URL trae ?token=, lo guarda y lo quita de la barra. */
export function obtenerToken(): string | null {
  try {
    const url = new URL(window.location.href);
    const nuevo = url.searchParams.get('token');
    if (nuevo) {
      localStorage.setItem(K_TOKEN, nuevo.trim());
      url.searchParams.delete('token');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    return localStorage.getItem(K_TOKEN);
  } catch {
    return null;
  }
}

export function guardarToken(token: string): void {
  localStorage.setItem(K_TOKEN, token.trim());
}

export function olvidarToken(): void {
  localStorage.removeItem(K_TOKEN);
}

export function leerCache(): Pedido[] {
  try {
    return JSON.parse(localStorage.getItem(K_CACHE) ?? '[]') as Pedido[];
  } catch {
    return [];
  }
}

function guardarCache(items: Pedido[]): void {
  try {
    localStorage.setItem(K_CACHE, JSON.stringify(items));
  } catch {
    /* sin espacio: no pasa nada */
  }
}

interface Respuesta {
  ok: boolean;
  error?: string;
  items?: Pedido[];
  resultado?: { id?: string; ids?: string[] };
}

interface Leida {
  items: Pedido[];
  resultado?: Respuesta['resultado'];
}

async function leer(r: Response): Promise<Leida> {
  if (!r.ok) throw new Error(`Error de red (${r.status})`);
  let datos: Respuesta;
  try {
    datos = (await r.json()) as Respuesta;
  } catch {
    throw new Error('Respuesta inválida del servidor');
  }
  if (!datos.ok) {
    if (datos.error === 'No autorizado') throw new ErrorNoAutorizado(datos.error);
    throw new Error(datos.error ?? 'Error desconocido');
  }
  const items = datos.items ?? [];
  guardarCache(items);
  return { items, resultado: datos.resultado };
}

export function crearApi(token: string) {
  if (!API_URL) throw new Error('Falta VITE_API_URL');
  const url = API_URL;

  // text/plain evita el preflight de CORS que Apps Script no responde.
  const enviar = async (cuerpo: Record<string, unknown>): Promise<Leida> =>
    leer(
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token, ...cuerpo }),
      }),
    );

  const escribir = async (cuerpo: Record<string, unknown>): Promise<Pedido[]> =>
    (await enviar(cuerpo)).items;

  return {
    listar: async (): Promise<Pedido[]> =>
      (await leer(await fetch(`${url}?token=${encodeURIComponent(token)}`))).items,
    crear: (dia: Dia, item: DatosPedido) => escribir({ accion: 'crear', item: { ...item, dia } }),
    /** Crea el pedido el lunes y lo copia a los demás días (2 peticiones). */
    crearEnTodos: async (item: DatosPedido): Promise<Pedido[]> => {
      const creado = await enviar({ accion: 'crear', item: { ...item, dia: 'lunes' } });
      const id = creado.resultado?.id;
      if (!id) throw new Error('No se pudo crear el pedido');
      try {
        return await escribir({ accion: 'copiarSemana', id });
      } catch (e) {
        if (e instanceof ErrorNoAutorizado) throw e;
        throw new Error(
          'El pedido se creó el lunes, pero no se pudo copiar a los demás días. Pulsa Actualizar y cópialo a la semana.',
        );
      }
    },
    /** Varios modelos (y varios días) en una sola petición. Requiere la acción crearVarios en Code.gs. */
    crearVarios: async (items: DatosPedido[], dias: Dia[]): Promise<Pedido[]> => {
      try {
        return await escribir({ accion: 'crearVarios', items, dias });
      } catch (e) {
        if (e instanceof Error && e.message === 'Accion no valida') {
          throw new Error(
            'Falta actualizar Code.gs en Apps Script (acción crearVarios) y crear una versión nueva de la implementación.',
          );
        }
        throw e;
      }
    },
    editar: (id: string, item: DatosPedido, dia?: Dia) =>
      escribir({ accion: 'editar', id, item: dia ? { ...item, dia } : item }),
    eliminar: (id: string) => escribir({ accion: 'eliminar', id }),
    copiar: (id: string, dias: Dia[]) => escribir({ accion: 'copiar', id, dias }),
    copiarSemana: (id: string) => escribir({ accion: 'copiarSemana', id }),
  };
}

export type Api = ReturnType<typeof crearApi>;
