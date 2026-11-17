import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, MoreHorizontal, Search } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAlertas } from '../api/hooks'
import { LogoMark } from './Logo'
import { NAV, navFor } from './nav'
import { SkeletonRows } from './States'

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

  const moreBtn = useRef<HTMLButtonElement>(null)
  const morePanel = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const primera = useRef(true)

  useEffect(() => {
    if (!more) return
    morePanel.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMoreAt(null)
      moreBtn.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [more])

  // SPA: titulo por ruta (2.4.2) y foco al contenido tras navegar para lectores de pantalla y teclado
  const titulo = current?.label === 'Inicio' ? 'Panel' : current?.label
  useEffect(() => {
    document.title = titulo ? `${titulo} | VetStock` : 'VetStock'
    if (primera.current) { primera.current = false; return }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname, titulo])

  const subtitle = pathname === '/' && usuario ? `Bienvenido de nuevo, ${usuario.nombre.split(' ')[0]}` : current?.subtitle

  return (
    <div className="app-bg">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <div className="app">
        <aside className="sidebar" aria-label="Marca y sesión">
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
              aria-label="Buscar en el catálogo"
              onSubmit={(e) => { e.preventDefault(); navigate(`/medicamentos?q=${encodeURIComponent(q.trim())}`) }}
            >
              <Search size={18} aria-hidden="true" />
              <input type="search" aria-label="Buscar medicamentos" placeholder="Buscar medicamentos" value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            <Link to="/alertas" className="icon-btn"><Bell size={20} aria-hidden="true" /><span className="sr-only">Alertas</span>{nAlertas > 0 && <span className="badge"><span className="sr-only"> pendientes: </span>{nAlertas > 99 ? '99+' : nAlertas}</span>}</Link>
          </header>
          <main id="contenido" ref={mainRef} className="content" tabIndex={-1}>
            <Suspense fallback={<SkeletonRows rows={4} h={72} />}><Outlet /></Suspense>
          </main>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Navegacion movil">
        {primeros.map(({ to, label, short, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="bn-item">
            <Icon size={21} aria-hidden="true" />{short ?? label}
          </NavLink>
        ))}
        <button type="button" ref={moreBtn} className="bn-item" aria-expanded={more} aria-controls="mas-nav" onClick={() => setMore((v) => !v)}>
          <MoreHorizontal size={21} aria-hidden="true" />Más
        </button>
      </nav>
      <div className="more-sheet" hidden={!more} onClick={() => setMore(false)}>
        <div className="more-panel" id="mas-nav" ref={morePanel} onClick={(e) => e.stopPropagation()}>
          {resto.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link"><Icon size={19} aria-hidden="true" />{label}</NavLink>
          ))}
          <button type="button" className="btn" onClick={logout}><LogOut size={16} aria-hidden="true" />Cerrar sesión</button>
        </div>
      </div>
    </div>
  )
}
