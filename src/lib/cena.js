/**
 * Cena de Navidad de la peña (El Ancla, 14 de diciembre de 2026).
 *
 * Mientras la cena esté "abierta", cada peñista tiene que decir si va (y, si
 * va, qué entrantes y qué plato principal quiere) ANTES de poder marcar si
 * juega. Las respuestas se guardan en cenas/{CENA.id}/respuestas/{peñistaId}.
 *
 * Para una cena futura basta con cambiar este objeto (id nuevo, fecha y menú).
 */
export const CENA = {
  id: 'navidad-2026',
  titulo: 'Cena de Navidad',
  lugar: 'El Ancla',
  fecha: '2026-12-14',
  precio: 35,
  incluye: ['Surtido de dulces', 'Bebida ilimitada hasta el postre', 'Pan'],
  // El restaurante deja elegir 4 entrantes para la mesa: cada uno vota los
  // que más le apetecen y salen los 4 más votados.
  maxEntrantes: 4,
  entrantes: [
    { id: 'ensalada-cabra', nombre: 'Ensalada de queso de cabra con frutos rojos', emoji: '🥗' },
    { id: 'tomate-aguacate', nombre: 'Tomate con aguacate y langostinos', emoji: '🥑' },
    { id: 'tomate-melva', nombre: 'Tomate con melva', emoji: '🍅' },
    { id: 'huevos-jamon', nombre: 'Huevos rotos con jamón', emoji: '🍳' },
    { id: 'huevos-gulas', nombre: 'Huevos rotos con gulas y gambas', emoji: '🦐' },
    { id: 'ibericos', nombre: 'Surtido de ibéricos', emoji: '🥓' },
    { id: 'langostinos', nombre: 'Langostinos cocidos', emoji: '🍤' },
    { id: 'croquetas', nombre: 'Surtido de croquetas (rabo de toro y pulpo a la gallega)', emoji: '🧆' },
  ],
  principales: [
    { id: 'secreto', nombre: 'Secreto a la brasa', emoji: '🥩' },
    { id: 'lagarto', nombre: 'Lagarto a la brasa', emoji: '🥩' },
    { id: 'churrasco', nombre: 'Churrasco a la brasa', emoji: '🍖' },
    { id: 'lomo-ajos', nombre: 'Lomo con ajos', emoji: '🧄' },
    { id: 'carne-salsa', nombre: 'Carne en salsa', emoji: '🍲' },
    { id: 'merluza', nombre: 'Merluza al horno', emoji: '🐟' },
    { id: 'bacalao', nombre: 'Bacalao gratinado con alioli y miel', emoji: '🐟' },
    { id: 'pulpo', nombre: 'Pulpo a la brasa o a la gallega', emoji: '🐙', suplemento: 5 },
    { id: 'entrecot', nombre: 'Entrecot de lomo bajo (350 g aprox.)', emoji: '🥩', suplemento: 5 },
  ],
}

/**
 * La cena se pregunta hasta el mismo día 14 incluido (a partir del 15 ya no
 * bloquea nada). Se calcula con la fecha local del móvil.
 */
export function cenaAbierta(ahora = new Date(), cena = CENA) {
  const [y, m, d] = cena.fecha.split('-').map(Number)
  const finDelDia = new Date(y, m - 1, d + 1)
  return ahora < finDelDia
}

/**
 * Valor de "asiste" para quien todavía tiene que consultarlo en casa: le deja
 * apuntarse al partido, pero la cena le sigue saliendo para que decida.
 */
export const CONSULTANDO = 'consultando'

/**
 * ¿Ha respondido lo suficiente para poder marcar si juega? (va + entrantes +
 * principal, no va, o todavía lo está consultando en casa).
 */
export function respuestaCompleta(respuesta, cena = CENA) {
  if (!respuesta) return false
  if (respuesta.asiste === false || respuesta.asiste === CONSULTANDO) return true
  if (respuesta.asiste !== true) return false
  const entrantes = respuesta.entrantes ?? []
  return (
    entrantes.length >= 1 &&
    entrantes.length <= cena.maxEntrantes &&
    entrantes.every((id) => cena.entrantes.some((e) => e.id === id)) &&
    cena.principales.some((p) => p.id === respuesta.principal)
  )
}

/**
 * Antiguos peñistas (y amigos) se apuntan con el enlace de la cena
 * (…/app-futbol-7/?cena) escribiendo su nombre. Su respuesta se guarda con un
 * id que empieza por "ext-", el nombre que escribieron y externo: true.
 */
export const LARGO_MAX_NOMBRE = 40

export function limpiarNombre(nombre) {
  return String(nombre ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LARGO_MAX_NOMBRE)
}

export function nombreValido(nombre) {
  return limpiarNombre(nombre).length >= 2
}

export function nuevoIdExterno() {
  const aleatorio =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  return `ext-${aleatorio}`
}

/** Nombre para mostrar de una respuesta (peñista de la lista o externo). */
export function nombreDeRespuesta(respuesta, peñistas) {
  return peñistas.find((p) => p.id === respuesta.id)?.nombre ?? respuesta.nombre ?? '—'
}

export function nombrePlato(id, cena = CENA) {
  return [...cena.entrantes, ...cena.principales].find((p) => p.id === id)?.nombre ?? id
}

/**
 * Resumen para el admin (y el contador público): quién va, votos de
 * entrantes (ordenados, los 4 primeros son los que salen), recuento de
 * principales y lo que costará.
 */
export function resumenCena(respuestas, peñistas, cena = CENA) {
  const activos = peñistas.filter((p) => p.activo)
  const porId = new Map(respuestas.map((r) => [r.id, r]))
  const van = respuestas.filter((r) => r.asiste === true)
  const noVan = respuestas.filter((r) => r.asiste === false)
  const consultando = respuestas.filter((r) => r.asiste === CONSULTANDO)
  const sinResponder = activos.filter((p) => !porId.has(p.id))

  const votos = cena.entrantes
    .map((e, orden) => ({
      ...e,
      orden,
      votos: van.filter((r) => (r.entrantes ?? []).includes(e.id)).length,
    }))
    .sort((a, b) => b.votos - a.votos || a.orden - b.orden)

  const principales = cena.principales
    .map((p) => ({ ...p, quienes: van.filter((r) => r.principal === p.id).map((r) => r.id) }))
    .filter((p) => p.quienes.length > 0)

  const suplementos = van.reduce(
    (total, r) => total + (cena.principales.find((p) => p.id === r.principal)?.suplemento ?? 0),
    0,
  )

  return {
    van,
    noVan,
    consultando,
    sinResponder,
    votos,
    entrantesGanadores: votos.filter((v) => v.votos > 0).slice(0, cena.maxEntrantes),
    principales,
    total: van.length * cena.precio + suplementos,
  }
}
