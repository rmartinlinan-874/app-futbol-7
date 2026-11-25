/**
 * Capitanes ("encargados") de cada convocatoria: salen AL AZAR entre los
 * peñistas confirmados para jugar ese día (nunca invitados), y también al azar
 * quién de los dos empieza a elegir.
 *
 * Convención del par de capitanes [blanco, amarillo]:
 * - capitanes[0] lleva el equipo Blanco ('A');
 * - capitanes[1] lleva el Amarillo ('B') y es quien ABRE la elección
 *   (ver capitanDelTurno en eleccion.js: empieza el índice 1).
 * Como el orden del par también se sortea, "quién empieza" es tan aleatorio
 * como "quién es capitán".
 */

/**
 * Número "aleatorio" pero fijo para cada (semilla, id): todos los móviles
 * sacan el mismo sorteo sin ponerse de acuerdo, y cambia cada semana porque la
 * semilla es el id de la convocatoria.
 */
function sorteoFijo(semilla, id) {
  let h = 2166136261
  for (const c of `${semilla}|${id}`) {
    h ^= c.codePointAt(0)
    h = Math.imul(h, 16777619)
  }
  // Mezcla final para que semillas parecidas den resultados bien distintos.
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Ordena el par al azar (fijo por semilla): el que quede en [1] empieza. */
function ordenarPar(par, semilla) {
  const [x, y] = par
  return sorteoFijo(`${semilla}|empieza`, x) < sorteoFijo(`${semilla}|empieza`, y) ? [x, y] : [y, x]
}

/**
 * Sorteo automático de capitanes, igual en todos los móviles para la misma
 * convocatoria. Cada candidato tiene un número al azar fijo para esa semana;
 * los dos más bajos son los capitanes. Que se apunte o se borre alguien solo
 * cambia los capitanes si afecta a esos dos (no se "re-sortea" todo).
 *
 * Devuelve [blanco, amarillo] (amarillo empieza), o [] si hay menos de dos.
 */
export function sortearCapitanes(candidatosIds, semilla = '') {
  if (candidatosIds.length < 2) return []
  const ordenados = [...candidatosIds].sort(
    (a, b) => sorteoFijo(semilla, a) - sorteoFijo(semilla, b) || a.localeCompare(b),
  )
  return ordenarPar(ordenados.slice(0, 2), semilla)
}

/**
 * Sorteo "de verdad" (distinto cada vez) para el botón del admin, que puede
 * repetirlo cuantas veces quiera. Devuelve [blanco, amarillo] (amarillo empieza).
 */
export function sortearCapitanesAhora(candidatosIds, aleatorio = Math.random) {
  if (candidatosIds.length < 2) return []
  const bolsa = [...candidatosIds]
  for (let i = bolsa.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]]
  }
  return bolsa.slice(0, 2)
}

/**
 * Capitanes que deben usarse ahora mismo para la elección de equipos:
 * - si la elección ya empezó, los que quedaron fijados al empezar;
 * - si no, los que haya sorteado o puesto el admin (si siguen apuntados);
 * - si no, el sorteo automático de la semana.
 * Devuelve null si no hay al menos dos peñistas jugando.
 */
export function capitanesDeLaEleccion({ eleccion, encargadosAdmin, idConvocatoria, candidatosIds }) {
  if (eleccion?.capitanes?.length === 2) return { capitanes: eleccion.capitanes, fijados: true }
  if (candidatosIds.length < 2) return null
  if (encargadosAdmin?.length === 2 && encargadosAdmin.every((id) => candidatosIds.includes(id))) {
    return { capitanes: encargadosAdmin, fijados: false }
  }
  return { capitanes: sortearCapitanes(candidatosIds, idConvocatoria), fijados: false }
}
