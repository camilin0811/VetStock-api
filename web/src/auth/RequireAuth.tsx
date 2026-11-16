import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type Rol } from './AuthContext'
import { Skeleton } from '../components/States'

export function Splash() {
  return (
    <div className="app-bg" role="status" aria-label="Cargando sesion">
      <div className="app" style={{ display: 'grid', placeItems: 'center' }}><Skeleton h={120} w={240} r={28} /></div>
    </div>
  )
}

export function RequireAuth({ roles }: { roles?: Rol[] }) {
  const { usuario, cargando } = useAuth()
  const loc = useLocation()
  if (cargando) return <Splash />
  if (!usuario) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />
  return <Outlet />
}
