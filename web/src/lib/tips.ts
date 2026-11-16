export const TIPS: { texto: string; destacado: string }[] = [
  { texto: 'Dispensa primero el lote que vence antes: ', destacado: 'FEFO' },
  { texto: 'Revisa cada semana los lotes que vencen en ', destacado: '30 días' },
  { texto: 'Mantén el stock mínimo al día para evitar ', destacado: 'quiebres' },
  { texto: 'Guarda las vacunas y biologicos siempre en ', destacado: 'cadena de frio' },
  { texto: 'Registra la fórmula médica en los productos que la ', destacado: 'requieren' },
  { texto: 'Anula una dispensacion con error: el stock vuelve a su ', destacado: 'lote' },
]
export const tipDelDia = () => TIPS[Math.floor(Date.now() / 86_400_000) % TIPS.length]
