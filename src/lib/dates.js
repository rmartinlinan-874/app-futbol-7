const HORA_PARTIDO = { horas: 21, minutos: 0 }

function pad(n) {
  return String(n).padStart(2, '0')
}

export function formatId(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Devuelve la fecha (a medianoche) del lunes de la convocatoria activa:
 * si hoy es lunes y aún no ha llegado la hora del partido, es hoy;
 * en cualquier otro caso, el próximo lunes.
 */
export function lunesConvocatoriaActiva(ahora = new Date()) {
  const dia = ahora.getDay() // 0=domingo, 1=lunes, ...
  const esLunesAntesDelPartido =
    dia === 1 &&
    (ahora.getHours() < HORA_PARTIDO.horas ||
      (ahora.getHours() === HORA_PARTIDO.horas && ahora.getMinutes() < HORA_PARTIDO.minutos))

  const diasHastaLunes = esLunesAntesDelPartido ? 0 : ((8 - dia) % 7 || 7)
  const lunes = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + diasHastaLunes)
  return lunes
}

export function idConvocatoriaActiva(ahora = new Date()) {
  return formatId(lunesConvocatoriaActiva(ahora))
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatearFechaLarga(idFecha) {
  const [y, m, d] = idFecha.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const texto = FORMATO_FECHA.format(date)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function horaPartidoTexto() {
  return `${pad(HORA_PARTIDO.horas)}:${pad(HORA_PARTIDO.minutos)}`
}
