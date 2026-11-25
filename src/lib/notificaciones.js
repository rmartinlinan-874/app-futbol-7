import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { app, db } from '../firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// Comprueba si este dispositivo/navegador puede recibir avisos: hace falta
// HTTPS, Service Worker, la API de Notification y que el navegador soporte
// Firebase Messaging (en iPhone, solo desde iOS 16.4 y con la app instalada
// en la pantalla de inicio).
export async function avisosDisponibles() {
  if (!VAPID_KEY) return false
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return false
  try {
    return await isSupported()
  } catch {
    return false
  }
}

async function tokenDeEsteDispositivo() {
  const registro = await navigator.serviceWorker.ready
  const messaging = getMessaging(app)
  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registro,
  })
}

// Cada peñista puede tener varios dispositivos: sus tokens se guardan en la
// lista fcmTokens. Este móvil recuerda qué token guardó y para qué peñista,
// para poder quitar el viejo cuando Firebase lo renueva o cuando en el móvil
// se cambia de peñista (así no se acumulan tokens muertos).
const CLAVE_TOKEN = 'apppena_token_dispositivo'

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_TOKEN) ?? 'null')
  } catch {
    return null
  }
}

async function guardarToken(peñistaId, token, tokensGuardados = []) {
  const anterior = leerGuardado()
  const yaEstaba = tokensGuardados.includes(token)
  if (anterior && (anterior.token !== token || anterior.peñistaId !== peñistaId)) {
    await updateDoc(doc(db, 'penistas', anterior.peñistaId), { fcmTokens: arrayRemove(anterior.token) }).catch(
      () => {},
    )
  }
  if (!yaEstaba || anterior?.peñistaId !== peñistaId) {
    await updateDoc(doc(db, 'penistas', peñistaId), { fcmTokens: arrayUnion(token) })
  }
  try {
    localStorage.setItem(CLAVE_TOKEN, JSON.stringify({ peñistaId, token }))
  } catch {
    // sin almacenamiento local: se seguirá funcionando, solo que sin limpiar
  }
}

// Pide permiso y, si lo concede, guarda el token de este dispositivo en su
// documento de peñista. Devuelve false sin lanzar error si el peñista lo
// deniega o el navegador no es compatible.
export async function activarAvisos(peñistaId, tokensGuardados = []) {
  const disponible = await avisosDisponibles()
  if (!disponible) return false

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return false

  const token = await tokenDeEsteDispositivo()
  if (!token) return false

  await guardarToken(peñistaId, token, tokensGuardados)
  return true
}

// Firebase renueva de vez en cuando el token de cada dispositivo, y el script
// de avisos quita del peñista los tokens que ya no valen. Por eso, cada vez
// que se abre la app con el permiso ya concedido, se pide el token actual en
// silencio (sin ventana de permiso) y se guarda si ha cambiado o falta. Así
// nadie se queda sin avisos ni ve otra vez el botón "Activa los avisos".
// Devuelve true si el dispositivo queda suscrito.
export async function renovarAvisosEnSilencio(peñistaId, tokensGuardados = []) {
  try {
    if (!(await avisosDisponibles())) return false
    if (Notification.permission !== 'granted') return false
    const token = await tokenDeEsteDispositivo()
    if (!token) return false
    await guardarToken(peñistaId, token, tokensGuardados)
    return true
  } catch {
    return false
  }
}

// Con la pestaña abierta y en primer plano, el navegador NO muestra la
// notificación del sistema automáticamente (eso solo pasa en segundo plano
// o con la app cerrada): hay que mostrarla nosotros a mano con el mismo
// aspecto que tendría en segundo plano.
export async function escucharAvisosEnPrimerPlano() {
  const disponible = await avisosDisponibles()
  if (!disponible) return

  const messaging = getMessaging(app)
  onMessage(messaging, async (payload) => {
    const { title, body, icon, badge } = payload.notification ?? {}
    if (!title) return
    const registro = await navigator.serviceWorker.ready
    registro.showNotification(title, { body, icon, badge })
  })
}
