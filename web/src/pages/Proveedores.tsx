import { useProveedores } from '../api/hooks'
import type { Proveedor } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CrudPage } from '../components/CrudPage'
import { puedeEscribirCatalogo } from '../components/nav'

export default function Proveedores() {
  const { usuario } = useAuth()
  const query = useProveedores()
  return (
    <CrudPage<Proveedor>
      singular="Proveedor" base="/proveedores" query={query} canWrite={puedeEscribirCatalogo(usuario?.rol)} nameOf={(p) => p.nombre}
      emptyText="Registra a quienes te abastecen para asociarlos a cada lote."
      deleteText={(p) => `Se eliminara ${p.nombre}. Si tiene lotes asociados no podras hacerlo.`}
      fields={[
        { name: 'nombre', label: 'Nombre', required: true, full: true }, { name: 'nit', label: 'NIT', required: true },
        { name: 'telefono', label: 'Telefono', type: 'tel', required: true }, { name: 'ciudad', label: 'Ciudad', required: true },
        { name: 'correo', label: 'Correo', type: 'email', hint: 'Opcional' },
      ]}
      columns={[
        { header: 'Proveedor', cell: (p) => <span className="row-title">{p.nombre}</span> }, { header: 'NIT', cell: (p) => p.nit },
        { header: 'Telefono', cell: (p) => p.telefono }, { header: 'Ciudad', cell: (p) => p.ciudad }, { header: 'Correo', cell: (p) => p.correo ?? '-' },
      ]}
    />
  )
}
