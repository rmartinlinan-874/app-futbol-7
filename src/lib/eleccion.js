/**
 * Elección de equipos por turnos entre los dos capitanes.
 *
 * capitanes = [primero, segundo] de la clasificación. El primero lleva el
 * equipo Blanco ('A') y el segundo el Amarillo ('B'); cada capitán ya está
 * en su equipo y no se elige.
 *
 * Orden de turnos: 2º, 1º, 1º y a partir de ahí alternos (2º, 1º, 2º, 1º…).
 * El 2º abre para compensar que el 1º elige dos seguidos.
 */

export const EQUIPO_DE_CAPITAN = ['A', 'B']

// Los equipos se guardan como 'A' / 'B' pero se muestran con el color del peto.
export const NOMBRE_EQUIPO = { A: 'Blanco', B: 'Amarillo' }

/** Todos los que juegan el partido (peñistas dentro del aforo + invitados confirmados). */
export function participantesDelPartido(aforo, peñistas) {
  const nombreDe = (id) => peñistas.find((p) => p.id === id)?.nombre ?? '—'
  return [
    ...aforo.peñistasJuegan.map((r) => ({ id: r.id, tipo: 'peñista', nombre: nombreDe(r.id) })),
    ...aforo.invitadosJuegan.map((i) => ({ id: i.id, tipo: 'invitado', nombre: i.nombre })),
  ]
}

/** Índice (0 = 1º clasificado, 1 = 2º) del capitán que elige en el turno n (empezando en 0). */
export function capitanDelTurno(n) {
  if (n === 0) return 1
  if (n === 1 || n === 2) return 0
  return n % 2 === 1 ? 1 : 0
}

/**
 * Deriva todo lo que la pantalla necesita a partir del documento guardado
 * de la elección y de los participantes actuales del partido.
 *
 * @param capitanes  [idPrimero, idSegundo] (fijados o provisionales)
 * @param elecciones lista guardada de {id, tipo, nombre, equipo, porId}
 * @param participantes lista actual de {id, tipo, nombre} que juegan
 */
export function estadoEleccion({ capitanes, elecciones = [], participantes }) {
  const idsParticipantes = new Set(participantes.map((p) => p.id))
  const elegidos = new Set(elecciones.map((e) => e.id))
  const esCapitan = new Set(capitanes)

  const libres = participantes.filter((p) => !esCapitan.has(p.id) && !elegidos.has(p.id))
  const turno = elecciones.length
  const indiceCapitanTurno = capitanDelTurno(turno)

  const equipo = (letra) => {
    const indiceCapitan = EQUIPO_DE_CAPITAN.indexOf(letra)
    const capitan = participantes.find((p) => p.id === capitanes[indiceCapitan]) ?? {
      id: capitanes[indiceCapitan],
      tipo: 'peñista',
      nombre: '—',
    }
    return [
      { ...capitan, esCapitan: true, sigueApuntado: idsParticipantes.has(capitan.id) },
      ...elecciones
        .filter((e) => e.equipo === letra)
        .map((e) => ({ ...e, esCapitan: false, sigueApuntado: idsParticipantes.has(e.id) })),
    ]
  }

  return {
    turno,
    idCapitanTurno: capitanes[indiceCapitanTurno],
    equipoTurno: EQUIPO_DE_CAPITAN[indiceCapitanTurno],
    libres,
    equipoA: equipo('A'),
    equipoB: equipo('B'),
    terminada: libres.length === 0 && elecciones.length > 0,
    hayDesapuntados: elecciones.some((e) => !idsParticipantes.has(e.id)) || capitanes.some((id) => !idsParticipantes.has(id)),
  }
}

/**
 * Asignaciones {idParticipante: 'A' | 'B'} para precargar el formulario de
 * resultado con los equipos que formaron los capitanes. Solo incluye a
 * quien sigue apuntado.
 */
export function asignacionesDesdeEleccion({ capitanes, elecciones = [], participantes }) {
  const ids = new Set(participantes.map((p) => p.id))
  const asignaciones = {}
  capitanes.forEach((id, i) => {
    if (ids.has(id)) asignaciones[id] = EQUIPO_DE_CAPITAN[i]
  })
  for (const e of elecciones) {
    if (ids.has(e.id)) asignaciones[e.id] = e.equipo
  }
  return asignaciones
}
