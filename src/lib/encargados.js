/**
 * Elige a los dos encargados de montar los equipos entre los candidatos
 * (peñistas confirmados para jugar esa convocatoria, nunca invitados):
 * 1) los más altos en la clasificación:
 * 2) en caso de empate a puntos, quien menos veces haya sido encargado;
 * 3) si el empate persiste, por sorteo entre los empatados.
 */
export function elegirCapitanes(candidatosIds, puntosPorId, vecesEncargadoPorId) {
  const candidatos = candidatosIds.map((id) => ({
    id,
    puntos: puntosPorId.get(id) ?? 0,
    vecesEncargado: vecesEncargadoPorId.get(id) ?? 0,
    azar: Math.random(),
  }))

  candidatos.sort(
    (a, b) => b.puntos - a.puntos || a.vecesEncargado - b.vecesEncargado || a.azar - b.azar,
  )

  return candidatos.slice(0, 2).map((c) => c.id)
}
