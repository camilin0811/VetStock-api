export type Rol = 'admin' | 'veterinario' | 'farmaceutico'
export type Especie = 'canino' | 'felino' | 'equino' | 'bovino' | 'general'
export const ESPECIES: Especie[] = ['canino', 'felino', 'equino', 'bovino', 'general']

export interface Usuario { id: number; nombre: string; correo: string; rol: Rol; createdAt: string; updatedAt: string }
export interface AuthRespuesta { message: string; data: { accessToken: string; refreshToken: string; usuario: Usuario } }
export interface Lista<T> { message: string; data: T[]; count: number }
export interface Un<T> { message: string; data: T }

export interface Categoria { id: number; nombre: string; descripcion: string | null }
export interface Medicamento {
  id: number; nombre: string; presentacion: string; especie: Especie; precio: number; stockMinimo: number
  requiereFormula: boolean; categorias: Categoria[]; createdAt: string; updatedAt: string
}
export interface Proveedor { id: number; nombre: string; nit: string; telefono: string; ciudad: string; correo: string | null }
export interface Lote {
  id: number; medicamentoId: number; proveedorId: number; medicamento?: Medicamento; proveedor?: Proveedor
  numeroLote: string; cantidadInicial: number; cantidad: number; fechaIngreso: string; fechaVencimiento: string
}
export type EstadoStock = 'OK' | 'STOCK_BAJO' | 'SIN_STOCK'
export interface ItemInventario { medicamento: Medicamento; disponible: number; vencido: number; estado: EstadoStock }
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'ANULACION'
export interface Movimiento {
  id: number; tipo: TipoMovimiento; cantidad: number; loteId: number; medicamentoId: number
  medicamento?: { id: number; nombre: string } | string; numeroLote: string; detalle: string
  usuario: { id: number; nombre: string } | null; fecha: string
}
export type TipoAlerta = 'STOCK_BAJO' | 'POR_VENCER' | 'VENCIDO'
export interface Alerta {
  tipo: TipoAlerta; medicamento: { id: number; nombre: string } | string; mensaje: string
  loteId?: number; fechaVencimiento?: string; diasRestantes?: number
}
export interface LoteUsado { loteId: number; numeroLote: string; cantidad: number; fechaVencimiento: string }
export interface Dispensacion {
  id: number; medicamentoId: number; medicamento?: { id: number; nombre: string } | Medicamento; cantidad: number
  mascota: string; veterinario: string; formula: string | null; fecha: string; total: number
  estado: 'ACTIVA' | 'ANULADA'; lotesUsados: LoteUsado[]; usuario: { id: number; nombre: string } | null
}
export interface ProximoVencimiento {
  loteId: number; numeroLote: string; medicamento: { id: number; nombre: string }
  fechaVencimiento: string; diasRestantes: number; cantidad: number
}
export interface Resumen {
  totalMedicamentos: number; unidadesDisponibles: number; valorInventario: number
  stockBajo: number; porVencer: number; vencidos: number
  dispensacionesHoy: number; dispensacionesSemana: number; porcentajeStockSaludable: number
  consumoUltimos7Dias: { fecha: string; unidades: number }[]
  proximosVencimientos: ProximoVencimiento[]; ultimasDispensaciones: Dispensacion[]
}
export interface ReporteStock { items: { medicamento: { id: number; nombre: string }; unidades: number; valor: number }[]; valorTotal: number }
export interface ReporteProveedor { proveedor: { id: number; nombre: string }; lotes: number; unidades: number; valor: number }
