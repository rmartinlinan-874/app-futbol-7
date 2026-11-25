/**
 * Recarga automática cuando se publica una versión nueva.
 *
 * Quien tiene la app abierta en segundo plano sigue con el código viejo hasta
 * que la cierra. Para evitarlo, se compara la versión de este código con
 * version.json (que se publica con cada versión) en dos momentos "seguros":
 * al arrancar (mientras se ve la pantalla de bienvenida) y cada vez que la
 * app vuelve a primer plano. Nunca mientras alguien la está usando, para no
 * cortarle a mitad de algo.
 *
 * Si tras recargar sigue llegando el código viejo (GitHub guarda la página en
 * caché unos minutos), no se vuelve a recargar hasta pasados 10 minutos: así
 * no puede entrar en bucle.
 */

const ESTA_VERSION = import.meta.env.VITE_VERSION_APP
const CLAVE = 'apppena_recarga_version'
const ESPERA_ENTRE_RECARGAS_MS = 10 * 60 * 1000

async function versionPublicada() {
  const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) return null
  const datos = await res.json()
  return typeof datos?.version === 'string' ? datos.version : null
}

async function comprobar() {
  try {
    if (!navigator.onLine) return
    const publicada = await versionPublicada()
    if (!publicada || publicada === ESTA_VERSION) return

    let anterior = null
    try {
      anterior = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null')
    } catch {
      anterior = null
    }
    if (anterior?.version === publicada && Date.now() - anterior.hora < ESPERA_ENTRE_RECARGAS_MS) return

    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ version: publicada, hora: Date.now() }))
    } catch {
      return // sin forma de evitar bucles: mejor no recargar
    }
    window.location.reload()
  } catch {
    // sin conexión o cualquier fallo: ya se comprobará la próxima vez
  }
}

export function vigilarVersionNueva() {
  // En desarrollo (npm run dev) no hay version.json.
  if (import.meta.env.DEV || !ESTA_VERSION) return
  comprobar()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') comprobar()
  })
}
