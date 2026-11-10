import { calcularClasificacion, calcularVecesEncargado } from './points.js'

/**
 * Número "aleatorio" pero fijo para cada (semilla, id): todos los móviles
 * sacan el mismo desempate sin ponerse de acuerdo, y cambia cada semana
 * porque la semilla es el id de la convocatoria.
 */
function sorteoFijo(semilla, id) {
  let h = 2166136261
  for (const c of `${semilla}|${id}`) {
    h ^= c.codePointAt(0)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/**
 * Elige a los dos encargados de montar los equipos entre los candidatos
 * (peñistas confirmados para jugar esa convocatoria, nunca invitados):
 * 1) los más altos en la clasificación;
 * 2) en caso de empate a puntos, quien menos veces haya sido encargado;
 * 3) si el empate persiste, por un sorteo fijo a partir de la semilla (el id
 *    de la convocatoria), para que todos los móviles calculen lo mismo.
 *
 * Devuelve [primero, segundo].
 */
export function elegirCapitanes(candidatosIds, puntosPorId, vecesEncargadoPorId, semilla = '') {
  const candidatos = candidatosIds.map((id) => ({
    id,
    puntos: puntosPorId.get(id) ?? 0,
    vecesEncargado: vecesEncargadoPorId.get(id) ?? 0,
    azar: sorteoFijo(semilla, id),
  }))

  candidatos.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      a.vecesEncargado - b.vecesEncargado ||
      a.azar - b.azar ||
      a.id.localeCompare(b.id),
  )

  return candidatos.slice(0, 2).map((c) => c.id)
}

/**
 * Capitanes automáticos de una convocatoria a partir de la clasificación y
 * del historial de "veces encargado" de ANTES de esa convocatoria (sus
 * propios resultado o encargados no deben influir en su propia elección).
 */
export function capitanesAutomaticos({ idConvocatoria, candidatosIds, convocatorias, peñistas }) {
  const anteriores = convocatorias.filter((c) => c.id !== idConvocatoria)
  const puntosPorId = new Map(calcularClasificacion(anteriores, peñistas).map((c) => [c.id, c.puntos]))
  return elegirCapitanes(candidatosIds, puntosPorId, calcularVecesEncargado(anteriores), idConvocatoria)
}

/**
 * Capitanes que deben usarse ahora mismo para la elección de equipos:
 * - si la elección ya empezó, los que quedaron fijados al empezar;
 * - si no, los que haya puesto el admin (si siguen apuntados a jugar);
 * - si no, los automáticos.
 * Devuelve null si no hay al menos dos peñistas jugando.
 */
export function capitanesDeLaEleccion({ eleccion, encargadosAdmin, idConvocatoria, candidatosIds, convocatorias, peñistas }) {
  if (eleccion?.capitanes?.length === 2) return { capitanes: eleccion.capitanes, fijados: true }
  if (candidatosIds.length < 2) return null
  if (encargadosAdmin?.length === 2 && encargadosAdmin.every((id) => candidatosIds.includes(id))) {
    return { capitanes: encargadosAdmin, fijados: false }
  }
  return {
    capitanes: capitanesAutomaticos({ idConvocatoria, candidatosIds, convocatorias, peñistas }),
    fijados: false,
  }
}
