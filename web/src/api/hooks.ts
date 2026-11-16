import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, del, get, post, put, unwrap } from './client'
import type {
  Alerta, Categoria, Dispensacion, ItemInventario, Lista, Lote, Medicamento, Movimiento, Proveedor,
  ReporteProveedor, ReporteStock, Resumen, Un, Usuario,
} from './types'
import { useToast } from '../components/Toast'

const lista = <T>(path: string, query?: Record<string, string | number | undefined>) => async () =>
  (await get<Lista<T>>(path, query)).data

export const useResumen = () => useQuery({ queryKey: ['resumen'], queryFn: async () => unwrap(await get<Un<Resumen>>('/reportes/resumen')) })

export const useAlertas = (tipo?: string, dias = 30) =>
  useQuery({ queryKey: ['alertas', tipo ?? 'todas', dias], queryFn: lista<Alerta>('/alertas', { tipo, dias }) })

export interface MedFiltros { q?: string; especie?: string; categoriaId?: number }
export const useMedicamentos = (f: MedFiltros = {}) =>
  useQuery({ queryKey: ['medicamentos', f], queryFn: lista<Medicamento>('/medicamentos', { ...f }), placeholderData: keepPreviousData })
export const useCategorias = () => useQuery({ queryKey: ['categorias'], queryFn: lista<Categoria>('/categorias') })
export const useProveedores = () => useQuery({ queryKey: ['proveedores'], queryFn: lista<Proveedor>('/proveedores') })
export const useInventario = () => useQuery({ queryKey: ['inventario'], queryFn: lista<ItemInventario>('/inventario') })
export const useLotes = (medicamentoId?: number) =>
  useQuery({ queryKey: ['lotes', medicamentoId ?? 'todos'], queryFn: lista<Lote>('/lotes', { medicamentoId }) })
export const useMovimientos = (f: { medicamentoId?: number; tipo?: string } = {}) =>
  useQuery({ queryKey: ['movimientos', f], queryFn: lista<Movimiento>('/movimientos', { ...f }) })
export const useDispensaciones = (f: { mascota?: string; desde?: string; hasta?: string; medicamentoId?: number } = {}) =>
  useQuery({ queryKey: ['dispensaciones', f], queryFn: lista<Dispensacion>('/dispensaciones', { ...f }) })
export const useUsuarios = (enabled = true) => useQuery({ queryKey: ['usuarios'], queryFn: lista<Usuario>('/usuarios'), enabled })

/** `{message, data}` de /reportes/consumo y /vencimientos: la API puede devolver la forma directa o envuelta. */
export interface ReporteConsumo { desde: string; hasta: string; totalUnidades: number; totalVentas: number; detalle: { medicamento: unknown; unidades: number; total: number }[] }
export interface ReporteVencimientos { totalPerdida: number; lotes: { lote: Lote; medicamento: Medicamento; perdida: number }[] }
export const useReporteConsumo = (desde?: string, hasta?: string) =>
  useQuery({ queryKey: ['rep-consumo', desde, hasta], queryFn: async () => unwrap(await get<ReporteConsumo | Un<ReporteConsumo>>('/reportes/consumo', { desde, hasta })) })
export const useReporteVencimientos = () =>
  useQuery({ queryKey: ['rep-venc'], queryFn: async () => unwrap(await get<ReporteVencimientos | Un<ReporteVencimientos>>('/reportes/vencimientos')) })
export const useReporteStock = () => useQuery({ queryKey: ['rep-stock'], queryFn: async () => unwrap(await get<Un<ReporteStock>>('/reportes/stock')) })
export const useReporteProveedores = (desde?: string, hasta?: string) =>
  useQuery({ queryKey: ['rep-prov', desde, hasta], queryFn: async () => unwrap(await get<Un<ReporteProveedor[]>>('/reportes/proveedores', { desde, hasta })) })

export function mensajesDe(e: unknown): string[] {
  return e instanceof ApiError ? e.messages : ['Ocurrió un error inesperado.']
}

/** Mutacion con toast de exito/error y recarga de datos. El error tambien se relanza al formulario. */
export function useAccion<V, R = unknown>(fn: (v: V) => Promise<R>, ok: string, toastError = true) {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { toast.success(ok); void qc.invalidateQueries() },
    onError: (e) => { if (toastError) toast.error(mensajesDe(e)) },
  })
}

type Obj = Record<string, unknown>
export const crear = (base: string) => (b: Obj) => post(base, b)
export const actualizar = (base: string) => ({ id, ...b }: Obj & { id: number }) => put(`${base}/${id}`, b)
export const borrar = (base: string) => (id: number) => del(`${base}/${id}`)
