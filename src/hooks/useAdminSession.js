import { useCallback, useState } from 'react'

const CLAVE = 'apppena_admin_pin'

/**
 * Sesión de administrador muy ligera: si hay un PIN guardado localmente,
 * se considera "admin". El PIN se reenvía en cada escritura protegida para
 * que las reglas de Firestore lo comparen con el guardado en config/general
 * (ver firestore.rules). No es autenticación fuerte, pero es suficiente para
 * disuadir a quien no conozca el PIN de la peña.
 */
export function useAdminSession() {
  const [pin, setPinState] = useState(() => {
    try {
      return localStorage.getItem(CLAVE) || null
    } catch {
      return null
    }
  })

  const entrar = useCallback((pinIntroducido) => {
    setPinState(pinIntroducido)
    try {
      localStorage.setItem(CLAVE, pinIntroducido)
    } catch {
      // sin localStorage habrá que reintroducir el PIN en cada visita
    }
  }, [])

  const salir = useCallback(() => {
    setPinState(null)
    try {
      localStorage.removeItem(CLAVE)
    } catch {
      /* noop */
    }
  }, [])

  return { pin, esAdmin: Boolean(pin), entrar, salir }
}
