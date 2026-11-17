import { diasDesdeHoy, diasHasta, hoy } from './fechas';

describe('fechas', () => {
  const original = process.env.TZ_CLINICA;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TZ_CLINICA;
    } else {
      process.env.TZ_CLINICA = original;
    }
  });

  // 02:30 UTC del 16 es todavia el 15 en Bogota (UTC-5)
  const madrugadaUtc = new Date('2026-11-16T02:30:00Z');

  it('usa America/Bogota por defecto y no UTC', () => {
    delete process.env.TZ_CLINICA;

    expect(hoy(madrugadaUtc)).toBe('2026-11-15');
  });

  it('respeta TZ_CLINICA', () => {
    process.env.TZ_CLINICA = 'Asia/Tokyo';

    expect(hoy(madrugadaUtc)).toBe('2026-11-16');
  });

  it('suma dias sobre el calendario de la clinica', () => {
    delete process.env.TZ_CLINICA;

    expect(diasDesdeHoy(0, madrugadaUtc)).toBe('2026-11-15');
    expect(diasDesdeHoy(1, madrugadaUtc)).toBe('2026-11-16');
    expect(diasDesdeHoy(-15, madrugadaUtc)).toBe('2026-10-31');
  });

  it('calcula los dias hasta una fecha desde la fecha de la clinica', () => {
    delete process.env.TZ_CLINICA;

    expect(diasHasta('2026-11-15', madrugadaUtc)).toBe(0);
    expect(diasHasta('2026-11-20', madrugadaUtc)).toBe(5);
  });
});
