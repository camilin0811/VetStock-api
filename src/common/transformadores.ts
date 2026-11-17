import { ValueTransformer } from 'typeorm';

// Postgres devuelve decimal como string; se expone como number en la API
export const numeroDecimal: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | number | null) =>
    valor === null || valor === undefined ? valor : Number(valor),
};
