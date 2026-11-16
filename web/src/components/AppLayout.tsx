import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, MoreHorizontal, Search } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAlertas } from '../api/hooks'
import { LogoMark } from './Logo'
import { NAV, navFor } from './nav'

export function AppLayout() {
  const { usuario, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [moreAt, setMoreAt] = useState<string | null>(null)
  const more = moreAt === pathname
  const setMore = (v: boolean | ((x: boolean) => boolean)) => setMoreAt((cur) => ((typeof v === 'function' ? v(cur === pathname) : v) ? pathname : null))
  const [q, setQ] = useState('')
  const alertas = useAlertas()
  const nAlertas = alertas.data?.length ?? 0
  const items = navFor(usuario?.rol)
  const current = [...NAV].reverse().find((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)))
  const primeros = items.filter((i) => i.mobile)
  const resto = items.filter((i) => !i.mobile)

  useEffect(() => {
    if (!more) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreAt(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [more])

  const subtitle = pathname === '/' && usuario ? `Bienvenido de nuevo, ${usuario.nombre.split(' ')[0]}` : current?.subtitle

  return (
    <div className="app-bg">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <div className="app">
        <aside className="sidebar" aria-label="Barra lateral">
          <Link to="/" className="brand" aria-label="VetStock, inicio">
            <span className="brand-mark"><LogoMark size={28} /></span>
            <span className="brand-name">VetStock</span>
          </Link>
          <nav className="side-nav" aria-label="Navegacion principal">
            <ul>
              {items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end={to === '/'} className="nav-link">
                    <Icon size={19} aria-hidden="true" />{label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {usuario && (
            <div className="user-card">
              <div className="user-row">
                <span className="avatar" aria-hidden="true">{usuario.nombre.charAt(0).toUpperCase()}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="user-name">{usuario.nombre}</div>
                  <div className="user-role">{usuario.rol}</div>
                </div>
              </div>
              <button type="button" className="btn sm" onClick={logout}><LogOut size={16} aria-hidden="true" />Cerrar sesión</button>
            </div>
          )}
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="topbar-title">
              <h1>{current?.label === 'Inicio' ? 'Panel' : current?.label ?? 'VetStock'}</h1>
              <p>{subtitle}</p>
            </div>
            <form
              className="search"
              role="search"
              onSubmit={(e) => { e.preventDefault(); navigate(`/medicamentos?q=${encodeURIComponent(q.trim())}`) }}
            >
              <Search size={18} aria-hidden="true" />
              <input type="search" aria-label="Buscar medicamentos" placeholder="Buscar medicamentos" value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            <Link to="/alertas" className="icon-btn" aria-label={nAlertas ? `Ver alertas (${nAlertas})` : 'Ver alertas'}><Bell size={20} aria-hidden="true" />{nAlertas > 0 && <span className="badge" aria-hidden="true">{nAlertas > 99 ? '99+' : nAlertas}</span>}</Link>
          </header>
          <main id="contenido" className="content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Navegacion movil">
        {primeros.map(({ to, label, short, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="bn-item">
            <Icon size={21} aria-hidden="true" />{short ?? label}
          </NavLink>
        ))}
        <button type="button" className="bn-item" aria-expanded={more} aria-controls="mas-nav" onClick={() => setMore((v) => !v)}>
          <MoreHorizontal size={21} aria-hidden="true" />Más
        </button>
      </nav>
      <div className="more-sheet" hidden={!more} onClick={() => setMore(false)}>
        <div className="more-panel" id="mas-nav" onClick={(e) => e.stopPropagation()}>
          {resto.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link"><Icon size={19} aria-hidden="true" />{label}</NavLink>
          ))}
          <button type="button" className="btn" onClick={logout}><LogOut size={16} aria-hidden="true" />Cerrar sesión</button>
        </div>
      </div>
    </div>
  )
}
