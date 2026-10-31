import { useEffect, type ReactNode } from 'react';

/**
 * Ventana modal.
 * - Móvil: hoja inferior, o pantalla completa si `completa` (el formulario).
 * - PC: diálogo centrado; pulsar fuera lo cierra.
 * En pantalla completa no queda margen que pulsar, así que no se cierra por accidente.
 */
export default function Hoja({
  titulo,
  onCerrar,
  completa = false,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  completa?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  const contenedor = completa
    ? 'items-stretch md:items-center'
    : 'items-end md:items-center';

  const panel = completa
    ? 'h-dvh rounded-none pt-[calc(1.25rem+env(safe-area-inset-top))] md:h-auto md:max-h-[92dvh] md:max-w-lg md:rounded-2xl md:pt-5'
    : 'max-h-[92dvh] rounded-t-2xl md:max-w-lg md:rounded-2xl';

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-black/40 ${contenedor}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full overflow-y-auto bg-fondo p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 ${panel}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="fx-btn fx-btn--secondary fx-btn--shine min-h-11 rounded-[10px] border border-borde2 bg-white px-4 text-sm font-bold text-tinta"
          >
            Cancelar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
