// Sube firestore.rules al proyecto Firebase usando la API de Firebase Rules
// directamente, con la cuenta de servicio de los avisos (secreto
// FIREBASE_SERVICE_ACCOUNT). Se usa en vez de "firebase deploy" porque esa
// herramienta exige permisos extra (activar APIs) que la cuenta no tiene.
//
// Uso: FIREBASE_SERVICE_ACCOUNT='{...}' node scripts/desplegar-reglas.mjs

import { readFileSync } from 'node:fs'
import { cert } from 'firebase-admin/app'

const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const proyecto = cuenta.project_id
const { access_token: token } = await cert(cuenta).getAccessToken()
const api = `https://firebaserules.googleapis.com/v1/projects/${proyecto}`
const cabeceras = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

async function llamar(metodo, url, cuerpo) {
  const res = await fetch(url, { method: metodo, headers: cabeceras, body: JSON.stringify(cuerpo) })
  const datos = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`Error ${res.status} en ${metodo} ${url}:\n${JSON.stringify(datos, null, 2)}`)
    process.exit(1)
  }
  return datos
}

const contenido = readFileSync('firestore.rules', 'utf8')
const ruleset = await llamar('POST', `${api}/rulesets`, {
  source: { files: [{ name: 'firestore.rules', content: contenido }] },
})
console.log(`Reglas compiladas: ${ruleset.name}`)

const nombreRelease = `projects/${proyecto}/releases/cloud.firestore`
await llamar('PATCH', `${api}/releases/cloud.firestore`, {
  release: { name: nombreRelease, rulesetName: ruleset.name },
})
console.log('Reglas de Firestore publicadas.')
