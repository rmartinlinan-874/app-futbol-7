export const AFORO_MIN = 14
export const AFORO_MAX = 16

function porOrdenDeApunte(a, b) {
  const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0
  const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0
  return ta - tb
}

/**
 * Calcula quién juega y quién queda en lista de espera.
 *
 * Reglas:
 * - Los peñistas que han dicho "juego" tienen prioridad, por orden de apunte.
 *   Si son más de AFORO_MAX, los primeros AFORO_MAX juegan y el resto espera.
 * - Los invitados NUNCA se añaden en automático: solo cuentan como "jugando"
 *   los que el admin ha marcado explícitamente como confirmados
 *   (invitado.confirmado === true), respetando igualmente el máximo de plazas.
 */
export function calcularAforo({ respuestasJuego, invitados }) {
  const peñistasOrdenados = [...respuestasJuego].sort(porOrdenDeApunte)
  const peñistasJuegan = peñistasOrdenados.slice(0, AFORO_MAX)
  const peñistasEnEspera = peñistasOrdenados.slice(AFORO_MAX)

  const plazasLibres = Math.max(0, AFORO_MAX - peñistasJuegan.length)

  const invitadosOrdenados = [...invitados].sort(porOrdenDeApunte)
  const invitadosConfirmados = invitadosOrdenados.filter((i) => i.confirmado)
  const invitadosJuegan = invitadosConfirmados.slice(0, plazasLibres)
  const invitadosEnEsperaPorAforo = invitadosConfirmados.slice(plazasLibres)
  const invitadosNoConfirmados = invitadosOrdenados.filter((i) => !i.confirmado)

  const totalJugando = peñistasJuegan.length + invitadosJuegan.length

  return {
    peñistasJuegan,
    peñistasEnEspera,
    invitadosJuegan,
    invitadosEnEspera: [...invitadosEnEsperaPorAforo, ...invitadosNoConfirmados],
    plazasLibres,
    totalJugando,
    faltanParaMinimo: Math.max(0, AFORO_MIN - totalJugando),
  }
}
