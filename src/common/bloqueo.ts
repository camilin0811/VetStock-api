import { EntityManager, FindOneOptions } from 'typeorm';

// Bloqueo de filas para transacciones concurrentes (FEFO y ajustes).
// sqlite (tests en memoria) no soporta SELECT ... FOR UPDATE, asi que se omite.
export function bloqueoPesimista(
  manager: EntityManager,
): FindOneOptions['lock'] {
  return manager.connection.options.type === 'better-sqlite3'
    ? undefined
    : { mode: 'pessimistic_write' };
}
