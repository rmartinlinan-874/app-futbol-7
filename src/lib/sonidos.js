/**
 * Sonidos de la convocatoria: aplauso al pulsar "Juego" y zumbido de error al
 * pulsar "No juego". Son archivos cortos en public/sonidos (efectos gratuitos
 * de Mixkit, recortados y con el volumen igualado).
 *
 * Los navegadores solo dejan sonar audio dentro del toque del usuario, así que
 * hay que llamar a estas funciones directamente en el manejador del clic,
 * antes de cualquier await.
 */

const CLAVE_SILENCIO = 'apppena_sin_sonidos'
const RUTA = `${import.meta.env.BASE_URL}sonidos/`
const cache = {}

function audio(nombre) {
  if (typeof Audio === 'undefined') return null
  if (!cache[nombre]) {
    cache[nombre] = new Audio(`${RUTA}${nombre}.mp3`)
    cache[nombre].preload = 'auto'
  }
  return cache[nombre]
}

/** Descarga los sonidos por adelantado para que suenen sin retraso. */
export function precargarSonidos() {
  if (sonidosActivados()) ['aplauso', 'error'].forEach(audio)
}

export function sonidosActivados() {
  try {
    return localStorage.getItem(CLAVE_SILENCIO) !== '1'
  } catch {
    return true
  }
}

export function activarSonidos(activos) {
  try {
    if (activos) localStorage.removeItem(CLAVE_SILENCIO)
    else localStorage.setItem(CLAVE_SILENCIO, '1')
  } catch {
    // sin almacenamiento local: el cambio dura mientras la app esté abierta
  }
}

function sonar(nombre) {
  if (!sonidosActivados()) return
  const a = audio(nombre)
  if (!a) return
  // Si el otro sonido seguía sonando, se corta para que no se mezclen.
  Object.values(cache).forEach((otro) => {
    if (otro !== a) otro.pause()
  })
  try {
    a.currentTime = 0
  } catch {
    // aún sin cargar: empezará desde el principio igualmente
  }
  a.play().catch(() => {})
}

export const aplauso = () => sonar('aplauso')
export const sonidoError = () => sonar('error')
