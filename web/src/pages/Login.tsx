import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LockKeyhole, Mail, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import type { Rol } from '../api/types'
import { LogoMark } from '../components/Logo'
import { LoginAccent } from '../components/LoginAccent'

export default function Login() {
  const { usuario, login, registro } = useAuth()
  const loc = useLocation()
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [enviando, setEnviando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  if (usuario) return <Navigate to={(loc.state as { from?: string } | null)?.from ?? '/'} replace />

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEnviando(true)
    setErrores([])
    try {
      if (modo === 'login') await login(String(f.get('correo')), String(f.get('clave')))
      else await registro({ nombre: String(f.get('nombre')), correo: String(f.get('correo')), clave: String(f.get('clave')), rol: String(f.get('rol')) as Rol })
    } catch (err) {
      setErrores(err instanceof ApiError ? err.messages : ['Ocurrio un error inesperado.'])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app-bg login-bg">
      <main className="login">
        <section className="login-form-side">
          <div className="brand" style={{ padding: 0 }}>
            <span className="brand-mark"><LogoMark size={28} /></span>
            <span className="brand-name">VetStock</span>
          </div>
          <div>
            <h1>{modo === 'login' ? 'Hola de nuevo' : 'Crea tu cuenta'}</h1>
            <p className="muted">{modo === 'login' ? 'Ingresa para ver el inventario de tu clinica.' : 'Unete al equipo de la farmacia veterinaria.'}</p>
          </div>

          <div className="chips" role="group" aria-label="Modo de acceso">
            <button type="button" className="chip" aria-pressed={modo === 'login'} onClick={() => { setModo('login'); setErrores([]) }}>Iniciar sesion</button>
            <button type="button" className="chip" aria-pressed={modo === 'registro'} onClick={() => { setModo('registro'); setErrores([]) }}>Crear cuenta</button>
          </div>

          <form className="stack" onSubmit={enviar} key={modo} style={{ gap: 14 }}>
            {modo === 'registro' && (
              <label className="field">Nombre completo
                <span className="input-icon"><User size={18} aria-hidden="true" /><input className="input" name="nombre" autoComplete="name" required minLength={2} /></span>
              </label>
            )}
            <label className="field">Correo
              <span className="input-icon"><Mail size={18} aria-hidden="true" /><input className="input" name="correo" type="email" autoComplete="email" required placeholder="tu@clinica.com" /></span>
            </label>
            <label className="field">Clave
              <span className="input-icon"><LockKeyhole size={18} aria-hidden="true" /><input className="input" name="clave" type="password" autoComplete={modo === 'login' ? 'current-password' : 'new-password'} required minLength={modo === 'registro' ? 8 : 1} /></span>
              {modo === 'registro' && <span className="hint">Minimo 8 caracteres.</span>}
            </label>
            {modo === 'registro' && (
              <label className="field">Rol
                <select className="select" name="rol" defaultValue="farmaceutico">
                  <option value="farmaceutico">Farmaceutico</option>
                  <option value="veterinario">Veterinario</option>
                </select>
              </label>
            )}
            {errores.length > 0 && (
              <div className="form-error" role="alert">
                {errores.length === 1 ? errores[0] : <ul>{errores.map((m) => <li key={m}>{m}</li>)}</ul>}
              </div>
            )}
            <button className="btn primary" style={{ justifyContent: 'center', height: 50 }} disabled={enviando}>
              {enviando ? 'Un momento...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
          {modo === 'login' && <p className="muted" style={{ fontSize: 13 }}>Demo: farmacia@vetstock.com / VetStock123*</p>}
        </section>
        <aside className="login-art" aria-hidden="true">
          <LoginAccent />
          <p className="login-quote">Cada lote en su lugar, cada paciente a tiempo.</p>
        </aside>
      </main>
    </div>
  )
}
