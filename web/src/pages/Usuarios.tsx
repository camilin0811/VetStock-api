import { useUsuarios } from '../api/hooks'
import type { Usuario } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CrudPage } from '../components/CrudPage'
import { fmtFecha } from '../lib/format'

const ROLES = [{ value: 'admin', label: 'Administrador' }, { value: 'veterinario', label: 'Veterinario' }, { value: 'farmaceutico', label: 'Farmaceutico' }]
const TONO = { admin: 'bad', veterinario: 'info', farmaceutico: 'ok' } as const

export default function Usuarios() {
  const { usuario } = useAuth()
  const query = useUsuarios(usuario?.rol === 'admin')
  return (
    <CrudPage<Usuario>
      singular="Usuario" base="/usuarios" query={query} canWrite nameOf={(u) => u.nombre} canDelete={(u) => u.id !== usuario?.id}
      emptyText="Las cuentas nuevas se crean desde la pantalla de registro."
      deleteText={(u) => `Se eliminará la cuenta de ${u.nombre}. No se puede deshacer.`}
      fields={[
        { name: 'nombre', label: 'Nombre', required: true, full: true }, { name: 'correo', label: 'Correo', type: 'email', required: true },
        { name: 'rol', label: 'Rol', type: 'select', options: ROLES, required: true },
        { name: 'clave', label: 'Clave', type: 'password', required: true, requiredOnCreateOnly: true, full: true, hint: 'Mínimo 8 caracteres.' },
      ]}
      columns={[
        { header: 'Nombre', cell: (u) => <span className="row-title">{u.nombre}{u.id === usuario?.id && <span className="muted"> (tu)</span>}</span> }, { header: 'Correo', cell: (u) => u.correo },
        { header: 'Rol', cell: (u) => <span className={`pill ${TONO[u.rol]}`}>{ROLES.find((r) => r.value === u.rol)?.label}</span> }, { header: 'Alta', cell: (u) => fmtFecha(u.createdAt) },
      ]}
    />
  )
}
