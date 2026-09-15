const HORA_PARTIDO = { horas: 21, minutos: 0 }

function pad(n) {
  return String(n).padStart(2, '0')
}

export function formatId(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Devuelve la fecha (a medianoche) del lunes de la convocatoria activa.
 *
 * De lunes a jueves, la convocatoria activa sigue siendo la del lunes de
 * esa misma semana (el partido ya jugado o a punto de jugarse): así el
 * admin tiene hasta el jueves para registrar el resultado y las cervezas
 * sin que la app salte ya a la semana siguiente. La convocatoria del
 * próximo lunes no se abre hasta el viernes.
 */
export function lunesConvocatoriaActiva(ahora = new Date()) {
  const dia = ahora.getDay() // 0=domingo, 1=lunes, ..., 5=viernes, 6=sábado
  const diasDesdeLunes = (dia + 6) % 7
  const lunesDeEstaSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - diasDesdeLunes)

  const abreConvocatoriaSiguiente = dia === 5 || dia === 6 || dia === 0 // viernes, sábado, domingo
  if (abreConvocatoriaSiguiente) {
    return new Date(
      lunesDeEstaSemana.getFullYear(),
      lunesDeEstaSemana.getMonth(),
      lunesDeEstaSemana.getDate() + 7,
    )
  }
  return lunesDeEstaSemana
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
