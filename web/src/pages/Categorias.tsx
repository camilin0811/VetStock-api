import { useCategorias } from '../api/hooks'
import type { Categoria } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { CrudPage } from '../components/CrudPage'
import { puedeEscribirCatalogo } from '../components/nav'

export default function Categorias() {
  const { usuario } = useAuth()
  const query = useCategorias()
  return (
    <CrudPage<Categoria>
      singular="Categoría" base="/categorias" query={query} canWrite={puedeEscribirCatalogo(usuario?.rol)} nameOf={(c) => c.nombre}
      emptyText="Agrupa medicamentos, vacunas e insumos para filtrarlos más fácil."
      fields={[{ name: 'nombre', label: 'Nombre', required: true, full: true }, { name: 'descripcion', label: 'Descripcion', type: 'textarea', full: true, hint: 'Opcional' }]}
      columns={[{ header: 'Categoria', cell: (c) => <span className="row-title">{c.nombre}</span> }, { header: 'Descripcion', cell: (c) => c.descripcion ?? '-' }]}
    />
  )
}
