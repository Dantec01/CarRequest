function Svg({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const IconEditar = () => <Svg d="M4 20h4L19 9l-4-4L4 16v4z" />;
export const IconCopiarDia = () => <Svg d="M9 9h11v11H9zM5 15V4h11" />;
export const IconCopiarSemana = () => <Svg d="M4 7h16v13H4zM4 11h16M8 4v4M16 4v4" />;
export const IconEliminar = () => <Svg d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />;
export const IconCerrar = () => <Svg d="M6 6l12 12M18 6L6 18" />;
export const IconMas = ({ className }: { className?: string }) => (
  <Svg d="M12 5v14M5 12h14" className={className} />
);
export const IconActualizar = ({ girando }: { girando?: boolean }) => (
  <Svg
    d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"
    className={girando ? 'h-5 w-5 animate-spin' : 'h-5 w-5'}
  />
);
export const IconDescargar = ({ className }: { className?: string }) => (
  <Svg d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" className={className} />
);
