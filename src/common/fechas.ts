const MS_POR_DIA = 24 * 60 * 60 * 1000;
const ZONA_POR_DEFECTO = 'America/Bogota';

// Zona horaria de la clinica: define cuando cambia el "dia" (env TZ_CLINICA)
export function zonaClinica(): string {
  return process.env.TZ_CLINICA || ZONA_POR_DEFECTO;
}

// Fecha (YYYY-MM-DD) en la zona de la clinica; en-CA ya formatea asi
export function hoy(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaClinica(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

// Suma dias sobre el calendario (sin horas), asi el cambio de horario no afecta
export function diasDesdeHoy(dias: number, ahora: Date = new Date()): string {
  return new Date(Date.parse(hoy(ahora)) + dias * MS_POR_DIA)
    .toISOString()
    .slice(0, 10);
}

export function diasHasta(fecha: string, ahora: Date = new Date()): number {
  return Math.round((Date.parse(fecha) - Date.parse(hoy(ahora))) / MS_POR_DIA);
}
