import { useQuery } from '@tanstack/react-query'
import { get, unwrap } from './client'
import type { Alerta, Lista, Resumen, Un } from './types'

export const useResumen = () =>
  useQuery({ queryKey: ['resumen'], queryFn: async () => unwrap((await get<Un<Resumen>>('/reportes/resumen'))) })

export const useAlertas = (tipo?: string, dias = 30) =>
  useQuery({
    queryKey: ['alertas', tipo ?? 'todas', dias],
    queryFn: async () => (await get<Lista<Alerta>>('/alertas', { tipo, dias })).data,
  })
