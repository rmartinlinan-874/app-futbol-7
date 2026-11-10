import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const UN_DIA = 24 * 3600 * 1000

/** ¿Se está usando la app instalada en la pantalla de inicio (y no en el navegador)? */
export function esAppInstalada() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  } catch {
    return false
  }
}

/**
 * Si este peñista abre la app instalada, deja constancia en su ficha
 * (appInstaladaEn) para que el admin sepa quién la tiene. Como mucho una
 * escritura al día por peñista, para no gastar escrituras de Firestore.
 * Nunca lanza: si falla, simplemente no se apunta.
 */
export async function registrarAppInstalada(peñista) {
  if (!peñista?.id || !esAppInstalada()) return
  const ultima = peñista.appInstaladaEn?.toMillis?.() ?? 0
  if (Date.now() - ultima < UN_DIA) return
  try {
    await updateDoc(doc(db, 'penistas', peñista.id), { appInstaladaEn: serverTimestamp() })
  } catch {
    // sin conexión o sin permisos: no es importante
  }
}
