import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from '../lib/useReveal'
import { AlertTriangle, ArrowRight, Bell, BarChart3, Boxes, CalendarClock, Heart, PackagePlus, Syringe, Truck } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useResumen } from '../api/hooks'
import { puedeEscribirCatalogo } from '../components/nav'
import { CountUp } from '../components/CountUp'
import { ProgressRing } from '../components/ProgressRing'
import { MiniBars } from '../components/MiniBars'
import { HeroScene } from '../components/HeroScene'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { diasLabel, diasTono, fmtFecha, fmtFechaHora, fmtMoney, nombreMed, plural } from '../lib/format'
import { tipDelDia } from '../lib/tips'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const { data: r, isLoading, error, refetch } = useResumen()
  const root = useRef<HTMLDivElement>(null)
  useReveal(root, [isLoading])
  const tip = tipDelDia()
  const nombre = usuario?.nombre.split(' ')[0] ?? ''
  const escribe = puedeEscribirCatalogo(usuario?.rol)

  const acciones = [
    ...(escribe ? [{ to: '/inventario?nuevo=lote', label: 'Registrar lote', icon: PackagePlus }] : []),
    { to: '/dispensar', label: 'Dispensar', icon: Syringe, principal: true },
    { to: '/alertas', label: 'Alertas', icon: Bell },
    { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  ]

  return (
    <div className="dash" ref={root}>
      <div className="dash-main">
        <section className="hero" aria-label="Bienvenida">
          <div className="hero-greet" data-reveal>
            <h2>{saludo()}, {nombre} <Heart size={26} fill="var(--violet-600)" color="var(--violet-600)" aria-hidden="true" /></h2>
            <p className="muted">Que tengas un gran día en la farmacia.</p>
          </div>
          <HeroScene />
          <div className="hero-card card" data-reveal>
            {isLoading ? (
              <><Skeleton h={18} w="70%" /><Skeleton h={14} w="50%" /><Skeleton h={40} r={999} /></>
            ) : r ? (
              <>
                <div className="row-title">Tu inventario</div>
                <div className="hero-card-stats">
                  <div><strong><CountUp value={r.totalMedicamentos} /></strong> <span className="muted">medicamentos</span></div>
                  <div><strong><CountUp value={r.unidadesDisponibles} /></strong> <span className="muted">unidades</span></div>
                  <div className="muted">Valor <strong style={{ color: 'var(--ink)' }}><CountUp value={r.valorInventario} format={fmtMoney} /></strong></div>
                </div>
                <Link to="/inventario" className="btn primary" style={{ justifyContent: 'center' }}>Ver inventario</Link>
              </>
            ) : (
              <><div className="row-title">Tu inventario</div><p className="muted">Sin datos por ahora.</p></>
            )}
          </div>
        </section>

        <nav className="quick" aria-label="Acciones rapidas" data-reveal>
          {acciones.map(({ to, label, icon: Icon, principal }) => (
            <Link key={to} to={to} className={`quick-item${principal ? ' main' : ''}`}>
              <span className="quick-ico"><Icon size={20} aria-hidden="true" /></span>{label}
            </Link>
          ))}
        </nav>

        {error ? (
          <div className="card"><ErrorState error={error} onRetry={() => refetch()} /></div>
        ) : (
          <div className="cols-2 dash-cards">
            <section className="card soft" data-reveal aria-labelledby="h-prox">
              <div className="card-head"><h2 id="h-prox">Próximos vencimientos</h2><Link className="link-more" to="/calendario">Ver todo</Link></div>
              {isLoading ? <div className="stack" style={{ gap: 10 }}><Skeleton h={62} r={16} /><Skeleton h={62} r={16} /></div> : !r?.proximosVencimientos.length ? (
                <EmptyState title="Nada por vencer" text="No hay lotes proximos a vencer." />
              ) : (
                <ul className="list">
                  {r.proximosVencimientos.map((v) => (
                    <li key={v.loteId} className="list-item">
                      <span className="list-ico"><CalendarClock size={20} aria-hidden="true" /></span>
                      <div className="grow">
                        <div className="row-title">{v.medicamento.nombre}</div>
                        <div className="row-sub">Lote {v.numeroLote} · {v.cantidad} u · {fmtFecha(v.fechaVencimiento)}</div>
                      </div>
                      <span className={`pill ${diasTono(v.diasRestantes)}`}>{diasLabel(v.diasRestantes)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card soft" data-reveal aria-labelledby="h-estado">
              <div className="card-head"><h2 id="h-estado">Estado de inventario</h2><Link className="link-more" to="/alertas">Ver alertas</Link></div>
              {isLoading ? <div className="stack" style={{ gap: 10 }}><Skeleton h={48} r={16} /><Skeleton h={48} r={16} /><Skeleton h={48} r={16} /></div> : r ? (
                <ul className="list">
                  <li className="list-item slim"><span className="list-ico"><Boxes size={19} aria-hidden="true" /></span><span className="grow">Stock saludable</span><span className="pill ok"><CountUp value={Math.round(r.porcentajeStockSaludable)} format={(n) => `${n}% OK`} /></span></li>
                  <li className="list-item slim"><span className="list-ico"><AlertTriangle size={19} aria-hidden="true" /></span><span className="grow">Stock bajo</span><span className="pill warn"><CountUp value={r.stockBajo} /> {plural(r.stockBajo, 'producto')}</span></li>
                  <li className="list-item slim"><span className="list-ico"><CalendarClock size={19} aria-hidden="true" /></span><span className="grow">Por vencer (30 días)</span><span className="pill info"><CountUp value={r.porVencer} /> {plural(r.porVencer, 'lote')}</span></li>
                  <li className="list-item slim"><span className="list-ico"><Bell size={19} aria-hidden="true" /></span><span className="grow">Vencidos</span><span className={`pill ${r.vencidos ? 'bad' : 'ok'}`}><CountUp value={r.vencidos} /> {plural(r.vencidos, 'lote')}</span></li>
                </ul>
              ) : null}
            </section>
          </div>
        )}

        <section className="card" data-reveal aria-labelledby="h-ult">
          <div className="card-head"><h2 id="h-ult">Últimas dispensaciones</h2><Link className="link-more" to="/dispensar">Ver todo</Link></div>
          {isLoading ? <Skeleton h={120} r={16} /> : !r?.ultimasDispensaciones.length ? (
            <EmptyState title="Aún no hay dispensaciones" text="Cuando entregues un medicamento aparecerá aquí." action={<Link to="/dispensar" className="btn primary">Dispensar ahora</Link>} />
          ) : (
            <ul className="list">
              {r.ultimasDispensaciones.map((d) => (
                <li key={d.id} className="list-item">
                  <span className="list-ico"><Syringe size={20} aria-hidden="true" /></span>
                  <div className="grow">
                    <div className="row-title">{nombreMed(d.medicamento)} x {d.cantidad}</div>
                    <div className="row-sub">Para {d.mascota} · {d.veterinario} · {fmtFechaHora(d.fecha)}</div>
                  </div>
                  <span className={`pill ${d.estado === 'ACTIVA' ? 'ok' : 'bad'}`}>{d.estado === 'ACTIVA' ? 'Activa' : 'Anulada'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="rail" aria-label="Widgets">
        <section className="card" data-reveal aria-labelledby="h-act">
          <h2 id="h-act" className="rail-title">Actividad de hoy</h2>
          {isLoading ? <div style={{ display: 'grid', justifyItems: 'center' }}><Skeleton h={168} w={168} r={84} /></div> : r ? (
            <>
              <div style={{ display: 'grid', justifyItems: 'center' }}>
                <ProgressRing value={r.porcentajeStockSaludable} label="Stock saludable">
                  <strong className="ring-num"><CountUp value={Math.round(r.porcentajeStockSaludable)} format={(n) => `${n}%`} /></strong>
                  <span className="muted ring-cap">Stock saludable</span>
                </ProgressRing>
              </div>
              <div className="mini-stats">
                <div><strong><CountUp value={r.dispensacionesHoy} /></strong><span>Hoy</span></div>
                <div><strong><CountUp value={r.dispensacionesSemana} /></strong><span>Semana</span></div>
                <div><strong><CountUp value={r.stockBajo} /></strong><span>Stock bajo</span></div>
              </div>
            </>
          ) : null}
        </section>

        <section className="card" data-reveal aria-labelledby="h-cons">
          <h2 id="h-cons" className="rail-title">Consumo 7 días</h2>
          {isLoading ? <Skeleton h={140} r={16} /> : r ? <MiniBars data={r.consumoUltimos7Dias} /> : null}
        </section>

        <section className="card tip" data-reveal aria-labelledby="h-tip">
          <h2 id="h-tip" className="rail-title">Tip del día</h2>
          <p className="tip-text">{tip.texto}<mark>{tip.destacado}</mark>.</p>
          <span className="tip-quote" aria-hidden="true">&rdquo;</span>
        </section>

        <section className="card cta" data-reveal aria-labelledby="h-cta">
          <h2 id="h-cta" className="rail-title">Tus proveedores</h2>
          <p className="muted">Contactos, NIT y entregas recientes.</p>
          <Link to="/proveedores" className="btn primary"><Truck size={17} aria-hidden="true" />Ver proveedores <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </aside>
    </div>
  )
}
