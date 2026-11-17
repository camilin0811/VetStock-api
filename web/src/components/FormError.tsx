export function FormError({ errores }: { errores: string[] }) {
  if (!errores.length) return null
  return (
    <div className="form-error" role="alert">
      {errores.length === 1 ? errores[0] : <ul>{errores.map((m) => <li key={m}>{m}</li>)}</ul>}
    </div>
  )
}
