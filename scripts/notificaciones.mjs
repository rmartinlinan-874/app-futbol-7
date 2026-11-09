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
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

async function destinatariosActivos() {
  const snap = await db.collection('penistas').where('activo', '==', true).get()
  return snap.docs
    .map((d) => ({ id: d.id, nombre: d.data().nombre, token: d.data().fcmToken }))
    .filter((p) => p.token)
}

// Si FCM dice que un token ya no es válido (el navegador lo revocó, se borró
// el sitio, etc.), lo quitamos del peñista: así la app vuelve a mostrarle el
// aviso de "Activa los avisos" en vez de reintentar para siempre un token
// muerto.
const ERRORES_TOKEN_MUERTO = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
])

async function enviar(destinatarios, { titulo, cuerpo }) {
  if (destinatarios.length === 0) {
    console.log('Sin destinatarios (nadie tiene avisos activados todavía).')
    return
  }
  const resultado = await messaging.sendEachForMulticast({
    tokens: destinatarios.map((d) => d.token),
    notification: { title: titulo, body: cuerpo },
    webpush: {
      fcmOptions: { link: URL_APP },
      notification: {
        icon: `${URL_APP}icon-192.png`,
        badge: `${URL_APP}icon-192.png`,
      },
    },
  })
  console.log(
    `Enviado a ${resultado.successCount}/${destinatarios.length} (${resultado.failureCount} fallos).`,
  )

  await Promise.all(
    resultado.responses.map(async (respuesta, i) => {
      if (respuesta.success) return
      const destinatario = destinatarios[i]
      const codigo = respuesta.error?.code ?? 'desconocido'
      console.log(`  Fallo para ${destinatario.nombre} (${destinatario.id}): ${codigo}`)
      if (ERRORES_TOKEN_MUERTO.has(codigo)) {
        await db.doc(`penistas/${destinatario.id}`).update({ fcmToken: FieldValue.delete() })
        console.log(`  Token muerto: borrado de ${destinatario.nombre}, se le volverá a pedir activar.`)
      }
    }),
  )
}

async function avisoSabado() {
  // GitHub Actions no garantiza que el cron se ejecute justo a la hora en
  // punto (puede retrasarse varias horas), así que en vez de exigir que sean
  // exactamente las 12:00, avisamos en la primera ejecución del sábado a
  // partir de esa hora. La comprobación de "ya avisado hoy" evita duplicados.
  const { dia, hora } = horaMadrid()
  if (dia !== 'Sat' || hora < 12) return

  const metaRef = db.doc('meta/notificaciones')
  const meta = (await metaRef.get()).data() ?? {}
  const hoy = fechaMadrid()
  if (meta.ultimoAvisoSabado === hoy) return

  console.log('Es sábado y ya son las 12:00 o más (Madrid): enviando aviso de convocatoria...')
  const destinatarios = await destinatariosActivos()
  await enviar(destinatarios, {
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
  const destinatarios = await destinatariosActivos()
  await enviar(destinatarios, {
    titulo: '🏆 Clasificación actualizada',
    cuerpo: 'Ya está el resultado del partido. Mira cómo queda la clasificación.',
  })
  for (const d of nuevas) notificadas.add(d.id)
  await metaRef.set({ convocatoriasNotificadas: [...notificadas] }, { merge: true })
}

// Envío manual de prueba a un solo peñista (workflow_dispatch con el input
// "penista_prueba"), para comprobar si a alguien en concreto le llegan los
// avisos sin tener que esperar al sábado o a un resultado nuevo.
async function avisoPrueba(nombre) {
  const snap = await db.collection('penistas').where('nombre', '==', nombre).get()
  if (snap.empty) {
    console.log(`No hay ningún peñista llamado "${nombre}".`)
    return
  }
  const d = snap.docs[0]
  const token = d.data().fcmToken
  if (!token) {
    console.log(`${nombre} no tiene avisos activados (sin fcmToken guardado).`)
    return
  }
  console.log(`Enviando aviso de prueba a ${nombre}...`)
  await enviar([{ id: d.id, nombre, token }], {
    titulo: '🔔 Prueba de avisos',
    cuerpo: 'Si ves esto, los avisos push te funcionan bien.',
  })
}

const penistaPrueba = process.env.PENISTA_PRUEBA?.trim()
if (penistaPrueba) {
  await avisoPrueba(penistaPrueba)
} else {
  await avisoSabado()
  await avisoResultado()
}
console.log('Comprobación de avisos terminada.')
