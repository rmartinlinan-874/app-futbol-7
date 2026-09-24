// Envía avisos push a los peñistas:
//  1) los sábados a las 12:00 (hora de Madrid), recordando que se abre la
//     convocatoria del lunes;
//  2) cuando se detecta un resultado de partido recién registrado, avisando
//     de que la clasificación se ha actualizado.
//
// Pensado para ejecutarse cada poco tiempo (ver .github/workflows/notificaciones.yml):
// no hace falta que sea instantáneo, así que cada ejecución simplemente
// comprueba si "toca" avisar y, si ya se avisó, no vuelve a hacerlo (se
// guarda constancia en el documento meta/notificaciones).

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

const URL_APP = 'https://rmartinlinan-874.github.io/app-futbol-7/'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
const messaging = getMessaging()

function horaMadrid() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  })
  const partes = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]))
  return { dia: partes.weekday, hora: Number(partes.hour) }
}

function fechaMadrid() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())
}

async function tokensActivos() {
  const snap = await db.collection('penistas').where('activo', '==', true).get()
  return snap.docs.map((d) => d.data().fcmToken).filter(Boolean)
}

async function enviar(tokens, { titulo, cuerpo }) {
  if (tokens.length === 0) {
    console.log('Sin destinatarios (nadie tiene avisos activados todavía).')
    return
  }
  const resultado = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: titulo, body: cuerpo },
    webpush: {
      fcmOptions: { link: URL_APP },
      notification: {
        icon: `${URL_APP}icon-192.png`,
        badge: `${URL_APP}icon-192.png`,
      },
    },
  })
  console.log(`Enviado a ${resultado.successCount}/${tokens.length} (${resultado.failureCount} fallos).`)
}

async function avisoSabado() {
  const { dia, hora } = horaMadrid()
  if (dia !== 'Sat' || hora !== 12) return

  const metaRef = db.doc('meta/notificaciones')
  const meta = (await metaRef.get()).data() ?? {}
  const hoy = fechaMadrid()
  if (meta.ultimoAvisoSabado === hoy) return

  console.log('Es sábado a las 12:00 (Madrid): enviando aviso de convocatoria...')
  const tokens = await tokensActivos()
  await enviar(tokens, {
    titulo: '⚽ Se abre la convocatoria',
    cuerpo: 'Ya puedes decir si juegas el próximo lunes.',
  })
  await metaRef.set({ ultimoAvisoSabado: hoy }, { merge: true })
}

async function avisoResultado() {
  const metaRef = db.doc('meta/notificaciones')
  const meta = (await metaRef.get()).data() ?? {}
  const notificadas = new Set(meta.convocatoriasNotificadas ?? [])

  const snap = await db.collection('convocatorias').get()
  const nuevas = snap.docs.filter((d) => d.data().resultado?.registrado && !notificadas.has(d.id))
  if (nuevas.length === 0) return

  console.log(`Resultado nuevo en ${nuevas.map((d) => d.id).join(', ')}: enviando aviso...`)
  const tokens = await tokensActivos()
  await enviar(tokens, {
    titulo: '🏆 Clasificación actualizada',
    cuerpo: 'Ya está el resultado del partido. Mira cómo queda la clasificación.',
  })
  for (const d of nuevas) notificadas.add(d.id)
  await metaRef.set({ convocatoriasNotificadas: [...notificadas] }, { merge: true })
}

await avisoSabado()
await avisoResultado()
console.log('Comprobación de avisos terminada.')
