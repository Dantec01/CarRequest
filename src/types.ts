export const DIAS = [
  { id: 'lunes', corto: 'Lun', largo: 'Lunes' },
  { id: 'martes', corto: 'Mar', largo: 'Martes' },
  { id: 'miercoles', corto: 'Mié', largo: 'Miércoles' },
  { id: 'jueves', corto: 'Jue', largo: 'Jueves' },
  { id: 'viernes', corto: 'Vie', largo: 'Viernes' },
  { id: 'sabado', corto: 'Sáb', largo: 'Sábado' },
] as const;

export type Dia = (typeof DIAS)[number]['id'];

export const CAMPOS = [
  'modelo',
  'subasta',
  'chasis',
  'anio',
  'grado',
  'km',
  'color',
  'puntaje',
  'precio',
  'nota',
] as const;

export type Campo = (typeof CAMPOS)[number];

export type DatosPedido = Record<Campo, string>;

export type Pedido = DatosPedido & {
  id: string;
  dia: Dia;
  orden: string;
  actualizado: string;
};

export interface Resultado {
  dia: Dia;
  modelo: string;
  lote: string;
  subasta: string;
  chasis: string;
  anio: string;
  grado: string;
  km: string;
  color: string;
  puntaje: string;
  precio: string;
  recibido: string;
}
