import { createContext, useContext, type ReactNode } from 'react'

export type Rol = 'admin' | 'veterinario' | 'farmaceutico'
export interface Usuario {
  id: number
  nombre: string
  correo: string
  rol: Rol
}

interface AuthState {
  usuario: Usuario | null
  logout: () => void
}

// Provisional: se reemplaza por la sesion real en el commit de login.
const demo: AuthState = {
  usuario: { id: 0, nombre: 'Demo', correo: 'demo@vetstock.com', rol: 'admin' },
  logout: () => {},
}
const Ctx = createContext<AuthState>(demo)

export function AuthProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={demo}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
