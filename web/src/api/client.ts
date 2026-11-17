const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000'
const REFRESH_KEY = 'vetstock.refresh'

export class ApiError extends Error {
  status: number
  messages: string[]
  constructor(status: number, messages: string[]) {
    super(messages.join('. '))
    this.status = status
    this.messages = messages
  }
}

// Access token solo en memoria; el refresh token sobrevive a recargas.
let accessToken: string | null = null
let onUnauthorized: () => void = () => {}

export const tokens = {
  get access() { return accessToken },
  get refresh() { try { return localStorage.getItem(REFRESH_KEY) } catch { return null } },
  set(access: string, refresh: string) {
    accessToken = access
    try { localStorage.setItem(REFRESH_KEY, refresh) } catch { /* sin almacenamiento */ }
  },
  clear() {
    accessToken = null
    try { localStorage.removeItem(REFRESH_KEY) } catch { /* sin almacenamiento */ }
  },
}
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

type Query = Record<string, string | number | boolean | undefined | null>
interface Opts { method?: string; body?: unknown; query?: Query; auth?: boolean }

function url(path: string, query?: Query) {
  const u = new URL(BASE + path)
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
  })
  return u.toString()
}

async function parseError(res: Response): Promise<ApiError> {
  let body: { message?: string | string[] } | null = null
  try { body = await res.json() } catch { /* sin cuerpo */ }
  const m = body?.message
  const messages = Array.isArray(m) ? m : m ? [m] : [`Error ${res.status}`]
  return new ApiError(res.status, messages)
}

async function raw(path: string, o: Opts): Promise<Response> {
  const headers: Record<string, string> = {}
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  if (o.auth !== false && accessToken) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(url(path, o.query), { method: o.method ?? 'GET', headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined })
  } catch {
    throw new ApiError(0, ['No se pudo conectar con el servidor. Verifica que la API esté en ejecución.'])
  }
}

let refreshing: Promise<boolean> | null = null
/** Renueva tokens una sola vez aunque varias peticiones fallen a la vez. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const rt = tokens.refresh
    if (!rt) return false
    try {
      const res = await raw('/auth/refresh', { method: 'POST', body: { refreshToken: rt }, auth: false })
      if (!res.ok) return false
      const json = await res.json()
      tokens.set(json.data.accessToken, json.data.refreshToken)
      return true
    } catch (e) {
      // Sin red no se invalida la sesion: el error sube y se conserva el refresh token.
      if (e instanceof ApiError && e.status === 0) throw e
      return false
    }
  })().finally(() => { refreshing = null })
  return refreshing
}

export async function api<T = unknown>(path: string, o: Opts = {}): Promise<T> {
  let res = await raw(path, o)
  if (res.status === 401 && o.auth !== false) {
    if (await refreshSession()) {
      res = await raw(path, o)
    }
    if (res.status === 401) {
      tokens.clear()
      onUnauthorized()
    }
  }
  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const get = <T>(path: string, query?: Query) => api<T>(path, { query })
export const post = <T>(path: string, body?: unknown, auth = true) => api<T>(path, { method: 'POST', body: body ?? {}, auth })
export const put = <T>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body })
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body })
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' })

/** Desenvuelve `{message,data,count}`; si la API devuelve la entidad directa, la deja igual. */
export const unwrap = <T>(r: { data: T } | T): T =>
  r && typeof r === 'object' && 'data' in (r as object) ? (r as { data: T }).data : (r as T)
