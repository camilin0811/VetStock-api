import { useState, type ReactNode } from 'react'
import { Pill as PillIcon } from 'lucide-react'

const ALTS: Record<string, string> = {
  tabletas: 'Foto referencial de tabletas',
  'tabletas-plato': 'Foto referencial de tabletas pequeñas',
  inyectables: 'Foto referencial de frascos inyectables',
  vacunas: 'Foto referencial de viales de vacuna',
  suspension: 'Foto referencial de un frasco de suspensión oral',
  pipeta: 'Foto referencial de pipetas',
  jeringas: 'Foto referencial de jeringas',
  guantes: 'Foto referencial de guantes de nitrilo',
}

// Las fotos son genericas por tipo de producto: la ruta guardada es la base sin tamano ni extension
export function MedImagen({ base, className, sizes, eager = false, size, fallback }: {
  base: string | null; className?: string; sizes: string; eager?: boolean
  size?: number; fallback?: ReactNode
}) {
  const [fallo, setFallo] = useState<string | null>(null)
  if (!base || fallo === base) return <>{fallback ?? <PillIcon size={size ? Math.round(size / 2) : 24} aria-hidden="true" />}</>
  const slug = base.split('/').pop() ?? ''
  return (
    <img
      className={className}
      src={`${base}-480.webp`}
      srcSet={`${base}-480.webp 480w, ${base}-960.webp 960w`}
      sizes={sizes}
      width={480} height={360}
      alt={ALTS[slug] ?? 'Foto referencial del medicamento'}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFallo(base)}
    />
  )
}
