import { useState, type FormEvent } from 'react';

export default function PantallaToken({
  mensaje,
  onGuardar,
}: {
  mensaje?: string | null;
  onGuardar: (token: string) => void;
}) {
  const [valor, setValor] = useState('');

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (valor.trim()) onGuardar(valor.trim());
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-5">
      <h1 className="text-2xl font-bold text-acento">CarRequest</h1>
      <p className="text-sm text-suave">
        {mensaje ?? 'Pega el token de acceso que te pasó Dan. Solo se pide una vez en este dispositivo.'}
      </p>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-label="Token de acceso"
          placeholder="Token"
          autoComplete="off"
          className="h-11 w-full rounded-[10px] border border-borde2 bg-white px-2.5 text-[15px] focus:border-acento focus:outline-none"
        />
        <button
          type="submit"
          className="fx-btn fx-btn--primary fx-btn--shine min-h-[52px] rounded-xl bg-acento text-base font-bold text-white"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
