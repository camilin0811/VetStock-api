const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export function diasDesdeHoy(dias: number): string {
  return new Date(Date.now() + dias * MS_POR_DIA).toISOString().slice(0, 10);
}

export function diasHasta(fecha: string): number {
  return Math.round((Date.parse(fecha) - Date.parse(hoy())) / MS_POR_DIA);
}
