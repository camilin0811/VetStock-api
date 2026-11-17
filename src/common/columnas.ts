// Postgres guarda los timestamps con zona horaria; sqlite (tests en memoria)
// no soporta timestamptz y usa datetime. Jest define NODE_ENV=test.
export const TIPO_FECHA_HORA: 'datetime' | 'timestamptz' =
  process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz';
