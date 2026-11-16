import {
  ArrowLeftRight, BarChart3, Bell, Boxes, CalendarDays, LayoutDashboard, Pill, Syringe, Tags, Truck, Users,
  type LucideIcon,
} from 'lucide-react'
import type { Rol } from '../auth/AuthContext'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  subtitle: string
  roles?: Rol[]
  mobile?: boolean
  short?: string
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, subtitle: 'Resumen de la farmacia', mobile: true },
  { to: '/medicamentos', label: 'Medicamentos', short: 'Fármacos', icon: Pill, subtitle: 'Catálogo de productos', mobile: true },
  { to: '/inventario', label: 'Inventario', icon: Boxes, subtitle: 'Existencias y lotes' },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight, subtitle: 'Kardex de entradas y salidas' },
  { to: '/dispensar', label: 'Dispensar', icon: Syringe, subtitle: 'Entrega de medicamentos a pacientes', mobile: true },
  { to: '/alertas', label: 'Alertas', icon: Bell, subtitle: 'Stock bajo y vencimientos', mobile: true },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, subtitle: 'Consumo, stock y proveedores' },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays, subtitle: 'Vencimientos por fecha' },
  { to: '/proveedores', label: 'Proveedores', icon: Truck, subtitle: 'Quién nos abastece' },
  { to: '/categorias', label: 'Categorías', icon: Tags, subtitle: 'Clasificación de productos' },
  { to: '/usuarios', label: 'Usuarios', icon: Users, subtitle: 'Cuentas y roles del equipo', roles: ['admin'] },
]

export const navFor = (rol?: Rol) => NAV.filter((i) => !i.roles || (rol && i.roles.includes(rol)))
export const puedeEscribirCatalogo = (rol?: Rol) => rol === 'admin' || rol === 'farmaceutico'
