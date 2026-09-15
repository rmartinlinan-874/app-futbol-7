import {
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// --- Acciones de cualquier peñista identificado (no requieren PIN) ---

export async function marcarRespuesta(idConvocatoria, peñistaId, juega) {
  await setDoc(
    doc(db, 'convocatorias', idConvocatoria, 'respuestas', peñistaId),
    { juega, timestamp: serverTimestamp() },
    { merge: true },
  )
}

export async function borrarRespuesta(idConvocatoria, peñistaId) {
  await deleteDoc(doc(db, 'convocatorias', idConvocatoria, 'respuestas', peñistaId))
}

export async function apuntarInvitado(idConvocatoria, { nombre, apuntadoPorId, apuntadoPorNombre }) {
  await addDoc(collection(db, 'convocatorias', idConvocatoria, 'invitados'), {
    nombre,
    apuntadoPorId,
    apuntadoPorNombre,
    confirmado: false,
    timestamp: serverTimestamp(),
  })
}

export async function quitarInvitado(idConvocatoria, invitadoId) {
  await deleteDoc(doc(db, 'convocatorias', idConvocatoria, 'invitados', invitadoId))
}

// --- Acciones de administración (requieren PIN; las reglas de Firestore lo validan) ---

export async function confirmarInvitado(idConvocatoria, invitadoId, confirmado, pin) {
  await updateDoc(doc(db, 'convocatorias', idConvocatoria, 'invitados', invitadoId), {
    confirmado,
    adminPin: pin,
  })
}

export async function sortearEncargados(idConvocatoria, candidatosIds, pin) {
  const barajados = [...candidatosIds].sort(() => Math.random() - 0.5)
  const encargados = barajados.slice(0, 2)
  await setDoc(
    doc(db, 'convocatorias', idConvocatoria),
    { encargados, adminPin: pin },
    { merge: true },
  )
  return encargados
}

export async function registrarResultado(idConvocatoria, { equipoA, equipoB, ganador, cerveza }, pin) {
  await setDoc(
    doc(db, 'convocatorias', idConvocatoria),
    {
      resultado: { registrado: true, equipoA, equipoB, ganador, cerveza },
      adminPin: pin,
    },
    { merge: true },
  )
}

export async function altaPeñista(nombre, pin) {
  await addDoc(collection(db, 'penistas'), {
    nombre,
    activo: true,
    creadoEn: serverTimestamp(),
    adminPin: pin,
  })
}

export async function editarPeñista(id, cambios, pin) {
  await updateDoc(doc(db, 'penistas', id), { ...cambios, adminPin: pin })
}

export async function verificarPin(pinIntroducido, config) {
  return Boolean(config?.pin) && pinIntroducido === config.pin
}

export async function cambiarConfig(cambios, pin) {
  await setDoc(doc(db, 'config', 'general'), { ...cambios, adminPin: pin }, { merge: true })
}
