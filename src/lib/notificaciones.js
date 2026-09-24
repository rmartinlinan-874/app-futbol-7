import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
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

// Pide permiso y, si lo concede, guarda el token de este dispositivo en su
// documento de peñista. Devuelve false sin lanzar error si el peñista lo
// deniega o el navegador no es compatible.
export async function activarAvisos(peñistaId) {
  const disponible = await avisosDisponibles()
  if (!disponible) return false

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return false

  const registro = await navigator.serviceWorker.ready
  const messaging = getMessaging(app)
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registro,
  })
  if (!token) return false

  await updateDoc(doc(db, 'penistas', peñistaId), { fcmToken: token })
  return true
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
