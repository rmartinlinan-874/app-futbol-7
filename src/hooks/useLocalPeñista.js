import { useCallback, useState } from 'react'

const CLAVE = 'apppena_peñista'

export function useLocalPeñista() {
  const [peñista, setPeñistaState] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE)
      return guardado ? JSON.parse(guardado) : null
    } catch {
      return null
    }
  })

  const setPeñista = useCallback((p) => {
    setPeñistaState(p)
    try {
      if (p) localStorage.setItem(CLAVE, JSON.stringify(p))
      else localStorage.removeItem(CLAVE)
    } catch {
      // localStorage no disponible; la sesión no se recordará entre visitas.
    }
  }, [])

  return [peñista, setPeñista]
}
