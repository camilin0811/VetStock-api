import { post } from '../api/client'
import { useUsuarios } from '../api/hooks'
import type { Usuario } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CrudPage } from '../components/CrudPage'
import { fmtFecha } from '../lib/format'
import { Etiqueta } from '../components/Etiqueta'

const ROLES = [{ value: 'admin', label: 'Administrador' }, { value: 'veterinario', label: 'Veterinario' }, { value: 'farmaceutico', label: 'Farmaceutico' }]
const TONO = { admin: 'info', veterinario: 'neutral', farmaceutico: 'neutral' } as const

export default function Usuarios() {
  const { usuario } = useAuth()
  const query = useUsuarios(usuario?.rol === 'admin')
  return (
    <CrudPage<Usuario>
      singular="Usuario" base="/usuarios" query={query} canWrite
      create={(b) => post('/usuarios', b)}
      nameOf={(u) => u.nombre} canDelete={(u) => u.id !== usuario?.id}
      emptyText="Crea cuentas para tu equipo y asigna su rol."
      deleteText={(u) => `Se eliminará la cuenta de ${u.nombre}. No se puede deshacer.`}
      fields={[
        { name: 'nombre', label: 'Nombre', required: true, full: true }, { name: 'correo', label: 'Correo', type: 'email', required: true },
        { name: 'rol', label: 'Rol', type: 'select', options: ROLES, required: true, defaultValue: 'farmaceutico' },
        { name: 'clave', label: 'Clave', type: 'password', required: true, requiredOnCreateOnly: true, full: true, hint: 'Mínimo 8 caracteres.' },
      ]}
      columns={[
        { header: 'Nombre', cell: (u) => <span className="row-title">{u.nombre}{u.id === usuario?.id && <span className="muted"> (tu)</span>}</span> }, { header: 'Correo', cell: (u) => u.correo },
        { header: 'Rol', cell: (u) => <Etiqueta tono={TONO[u.rol]} icon={false}>{ROLES.find((r) => r.value === u.rol)?.label}</Etiqueta> }, { header: 'Alta', cell: (u) => fmtFecha(u.createdAt) },
      ]}
    />
  )
}
