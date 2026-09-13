import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const usarEmulador = import.meta.env.VITE_USE_EMULATOR === 'true'

const firebaseConfig = usarEmulador
  ? { apiKey: 'demo-key', projectId: 'demo-app-pena' }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

// Este módulo se importa siempre (aunque falte configurar Firebase, ver
// main.jsx), así que no debe lanzar al cargarse: si no hay apiKey, se deja
// todo en null y ensureAuth() nunca llega a usarse porque main.jsx muestra
// la pantalla de "falta configurar" en su lugar.
const configurado = Boolean(firebaseConfig.apiKey)

export const app = configurado ? initializeApp(firebaseConfig) : null
export const auth = configurado ? getAuth(app) : null
export const db = configurado ? getFirestore(app) : null

if (configurado && usarEmulador) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// La app no tiene login real: cada peñista se identifica eligiendo su nombre
// (ver useLocalPeñista). El inicio de sesión anónimo es solo para que las
// reglas de seguridad de Firestore puedan exigir "usuario autenticado" y así
// evitar escrituras de bots/desconocidos, sin pedir cuenta a nadie.
let authReadyPromise = null
export function ensureAuth() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsubscribe()
            resolve(user)
          } else {
            signInAnonymously(auth).catch(reject)
          }
        },
        reject,
      )
    })
  }
  return authReadyPromise
}
