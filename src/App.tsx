import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cabecera from './components/Cabecera';
import Formulario, { type DiaOTodos } from './components/Formulario';
import { IconMas } from './components/Iconos';
import PantallaToken from './components/PantallaToken';
import SelectorDias from './components/SelectorDias';
import Tablero from './components/Tablero';
import type { AccionesTarjeta } from './components/Tarjeta';
import VistaDia from './components/VistaDia';
import VistaResultados from './components/VistaResultados';
import {
  ErrorNoAutorizado,
  crearApi,
  guardarToken,
  hayApiConfigurada,
  leerCache,
  leerCacheResultados,
  obtenerToken,
  olvidarToken,
} from './storage';
import { type DatosPedido, type Dia, type Pedido, type Resultado } from './types';
import { diaDeHoy, esResultadoValido, useMediaQuery } from './util';

type Modal =
  | { tipo: 'nuevo'; dia: Dia }
  | { tipo: 'editar'; pedido: Pedido }
  | { tipo: 'copiar'; pedido: Pedido };

export default function App() {
  const [token, setToken] = useState<string | null>(() => obtenerToken());
  const [mensaje, setMensaje] = useState<string | null>(null);

  if (!hayApiConfigurada) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 px-5">
        <h1 className="text-2xl font-bold text-acento">CarsRequest</h1>
        <p className="text-sm text-suave">
          Falta la variable <b>VITE_API_URL</b> (la URL de Apps Script). Revisa el archivo .env.local.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <PantallaToken
        mensaje={mensaje}
        onGuardar={(t) => {
          guardarToken(t);
          setMensaje(null);
          setToken(t);
        }}
      />
    );
  }

  return (
    <Aplicacion
      token={token}
      onSinAcceso={() => {
        olvidarToken();
        setMensaje('El token no es válido. Pega el correcto.');
        setToken(null);
      }}
    />
  );
}

function Aplicacion({ token, onSinAcceso }: { token: string; onSinAcceso: () => void }) {
  const api = useMemo(() => crearApi(token), [token]);
  const escritorio = useMediaQuery('(min-width: 768px)');
  const hoy = useMemo(() => diaDeHoy(), []);

  const [pedidos, setPedidos] = useState<Pedido[]>(() => leerCache());
  const [resultados, setResultados] = useState<Resultado[]>(() => leerCacheResultados());
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultima, setUltima] = useState<Date | null>(null);
  const [diaSel, setDiaSel] = useState<Dia>(hoy);
  const [viendoRes, setViendoRes] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const sinAcceso = useRef(onSinAcceso);
  sinAcceso.current = onSinAcceso;

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso(null), 2500);
  }, []);

  const fallo = useCallback((e: unknown) => {
    if (e instanceof ErrorNoAutorizado) {
      sinAcceso.current();
      return;
    }
    setError(e instanceof Error ? e.message : 'Error desconocido');
  }, []);

  // Lectura manual: solo al abrir y cuando se pulsa "Actualizar".
  const refrescar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, res] = await Promise.all([
        api.listar(),
        api.listarResultados().catch((e) => {
          if (e instanceof ErrorNoAutorizado) throw e;
          return null;
        }),
      ]);
      setPedidos(lista);
      if (res) setResultados(res);
      setUltima(new Date());
    } catch (e) {
      fallo(e);
    } finally {
      setCargando(false);
    }
  }, [api, fallo]);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  // Cada escritura devuelve el tablero completo y se usa para refrescar la pantalla.
  const ejecutar = async (accion: () => Promise<Pedido[]>, texto: string): Promise<boolean> => {
    setOcupado(true);
    setError(null);
    try {
      setPedidos(await accion());
      setUltima(new Date());
      avisar(texto);
      return true;
    } catch (e) {
      fallo(e);
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const nombre = (p: Pedido) => p.modelo || 'este pedido';

  const acciones: AccionesTarjeta = {
    editar: (pedido) => setModal({ tipo: 'editar', pedido }),
    copiarDia: (pedido) => setModal({ tipo: 'copiar', pedido }),
    copiarSemana: (p) => {
      if (window.confirm(`¿Copiar "${nombre(p)}" a los otros 5 días?`)) {
        void ejecutar(() => api.copiarSemana(p.id), 'Copiado a toda la semana');
      }
    },
    eliminar: (p) => {
      if (window.confirm(`¿Eliminar "${nombre(p)}"?`)) {
        void ejecutar(() => api.eliminar(p.id), 'Pedido eliminado');
      }
    },
  };

  const guardarFormulario = async (dia: DiaOTodos, items: DatosPedido[]) => {
    const datos = items[0];
    if (!modal || modal.tipo === 'copiar') return;
    const m = modal;
    const ok =
      m.tipo === 'nuevo'
        ? await ejecutar(
            () => (dia === 'todos' ? api.crearEnTodos(datos) : api.crear(dia, datos)),
            dia === 'todos' ? 'Pedido agregado a todos los días' : 'Pedido guardado',
          )
        : await ejecutar(
            () => api.editar(m.pedido.id, datos, dia !== 'todos' && dia !== m.pedido.dia ? dia : undefined),
            'Pedido actualizado',
          );
    if (ok) {
      setModal(null);
      if (!escritorio && dia !== 'todos') setDiaSel(dia);
    }
  };

  const copiarDias = async (p: Pedido, dias: Dia[]) => {
    const texto = `Copiado a ${dias.length} ${dias.length === 1 ? 'día' : 'días'}`;
    if (await ejecutar(() => api.copiar(p.id, dias), texto)) setModal(null);
  };

  const totalResultados = resultados.filter(esResultadoValido).length;

  return (
    <div className="min-h-dvh">
      <Cabecera
        onActualizar={refrescar}
        cargando={cargando}
        ultima={ultima}
        acciones={
          escritorio ? (
            <>
              <button
                type="button"
                onClick={() => setModal({ tipo: 'nuevo', dia: hoy })}
                className="fx-btn fx-btn--primary fx-btn--shine flex h-11 items-center gap-2 rounded-[10px] bg-acento px-4 text-sm font-bold text-white"
              >
                <IconMas className="h-4 w-4" />
                Nuevo pedido
              </button>
              <button
                type="button"
                onClick={() => setViendoRes((v) => !v)}
                className={`fx-btn fx-btn--secondary fx-btn--shine flex h-11 items-center gap-2 rounded-[10px] border px-4 text-sm font-bold ${
                  viendoRes
                    ? 'border-acento bg-acento-claro text-acento'
                    : 'border-borde2 bg-white text-tinta'
                }`}
              >
                Resultados
                {resultados.length > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold leading-none text-white ${
                      totalResultados > 0 ? 'bg-[#1E7A3C]' : 'bg-suave'
                    }`}
                  >
                    {totalResultados}
                  </span>
                )}
              </button>
            </>
          ) : undefined
        }
      />

      {error && (
        <div
          role="alert"
          className="mx-5 mb-3 flex items-center justify-between gap-3 rounded-xl bg-[#FBE3E0] px-3 py-2 text-sm text-peligro md:mx-8"
        >
          <span>{error}</span>
          <button type="button" onClick={() => void refrescar()} className="min-h-11 font-bold underline">
            Reintentar
          </button>
        </div>
      )}

      {escritorio ? (
        <Tablero
          pedidos={pedidos}
          resultados={resultados}
          hoy={hoy}
          viendoResultados={viendoRes}
          acciones={acciones}
          deshabilitado={ocupado}
          onNuevo={(dia) => setModal({ tipo: 'nuevo', dia })}
          onCerrarResultados={() => setViendoRes(false)}
        />
      ) : (
        <VistaDia
          pedidos={pedidos}
          resultados={resultados}
          diaSel={diaSel}
          onDia={setDiaSel}
          acciones={acciones}
          deshabilitado={ocupado}
          onNuevo={(dia) => setModal({ tipo: 'nuevo', dia })}
          onResultados={() => setViendoRes(true)}
        />
      )}

      {modal && modal.tipo !== 'copiar' && (
        <Formulario
          inicial={modal.tipo === 'editar' ? modal.pedido : undefined}
          diaInicial={modal.tipo === 'nuevo' ? modal.dia : modal.pedido.dia}
          guardando={ocupado}
          onGuardar={guardarFormulario}
          onCerrar={() => setModal(null)}
        />
      )}

      {modal?.tipo === 'copiar' && (
        <SelectorDias
          pedido={modal.pedido}
          guardando={ocupado}
          onCopiar={(dias) => void copiarDias(modal.pedido, dias)}
          onCerrar={() => setModal(null)}
        />
      )}

      {!escritorio && viendoRes && (
        <VistaResultados
          resultados={resultados}
          onCerrar={() => setViendoRes(false)}
        />
      )}

      {aviso && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-tinta px-4 py-2 text-sm text-white"
        >
          {aviso}
        </div>
      )}
    </div>
  );
}
