import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'

export default function NoEncontrada() {
  return <div className="card"><EmptyState title="Página no encontrada" text="La dirección no existe o ya no está disponible." action={<Link to="/" className="btn primary">Ir al inicio</Link>} /></div>
}
