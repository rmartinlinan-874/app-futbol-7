export const PUNTOS = { victoria: 3, empate: 2, derrota: 1 }
export const PUNTO_CERVEZA = 0.5

/**
 * Recorre los resultados registrados de todas las convocatorias y devuelve
 * la clasificación acumulada por peñista. Los invitados nunca puntúan.
 */
export function calcularClasificacion(convocatorias, peñistas) {
  const puntos = new Map(peñistas.map((p) => [p.id, 0]))
  const partidosJugados = new Map(peñistas.map((p) => [p.id, 0]))

  for (const conv of convocatorias) {
    const resultado = conv.resultado
    if (!resultado?.registrado) continue

    const equipoDe = new Map()
    for (const miembro of resultado.equipoA ?? []) equipoDe.set(miembro.id, 'A')
    for (const miembro of resultado.equipoB ?? []) equipoDe.set(miembro.id, 'B')

    for (const miembro of [...(resultado.equipoA ?? []), ...(resultado.equipoB ?? [])]) {
      if (miembro.tipo !== 'peñista' || !puntos.has(miembro.id)) continue

      const equipo = equipoDe.get(miembro.id)
      let ganados
      if (resultado.ganador === 'empate') ganados = PUNTOS.empate
      else ganados = resultado.ganador === equipo ? PUNTOS.victoria : PUNTOS.derrota

      puntos.set(miembro.id, puntos.get(miembro.id) + ganados)
      partidosJugados.set(miembro.id, partidosJugados.get(miembro.id) + 1)
    }

    for (const idCerveza of resultado.cerveza ?? []) {
      if (puntos.has(idCerveza)) puntos.set(idCerveza, puntos.get(idCerveza) + PUNTO_CERVEZA)
    }
  }

  return peñistas
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      puntos: puntos.get(p.id) ?? 0,
      partidosJugados: partidosJugados.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, 'es'))
}
