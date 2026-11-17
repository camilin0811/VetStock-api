import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { get, post, refreshSession, setUnauthorizedHandler, tokens } from '../api/client'
import type { AuthRespuesta, Rol, Un, Usuario } from '../api/types'

export type { Rol, Usuario }

interface RegistroDatos { nombre: string; correo: string; clave: string; rol?: Rol }
interface AuthState {
  usuario: Usuario | null
  cargando: boolean
  login: (correo: string, clave: string) => Promise<void>
  registro: (d: RegistroDatos) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(() => !!tokens.refresh)

  const cerrar = useCallback(() => {
    tokens.clear()
    setUsuario(null)
    qc.clear()
  }, [qc])

  // Sesión previa: refresh token en localStorage -> access en memoria + perfil.
  useEffect(() => {
    setUnauthorizedHandler(cerrar)
    if (!tokens.refresh) return
    let vivo = true
    ;(async () => {
      try {
        if (await refreshSession()) {
          const p = await get<Un<Usuario>>('/auth/perfil')
          if (vivo) setUsuario(p.data)
        } else tokens.clear()
      } catch {
        // API caida: se conserva el refresh token y se pide login de nuevo
      } finally {
        if (vivo) setCargando(false)
      }
    })()
    return () => { vivo = false }
  }, [cerrar])

  const aceptar = (r: AuthRespuesta) => {
    tokens.set(r.data.accessToken, r.data.refreshToken)
    setUsuario(r.data.usuario)
  }
  const value = useMemo<AuthState>(() => ({
    usuario,
    cargando,
    login: async (correo, clave) => aceptar(await post<AuthRespuesta>('/auth/login', { correo, clave }, false)),
    registro: async (d) => aceptar(await post<AuthRespuesta>('/auth/registro', d, false)),
    logout: cerrar,
  }), [usuario, cargando, cerrar])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}
