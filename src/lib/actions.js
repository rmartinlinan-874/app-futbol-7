import {
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'
import { capitanDelTurno, EQUIPO_DE_CAPITAN } from './eleccion'

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

// --- Elección de equipos por turnos ---
//
// Cada movimiento va en una transacción que vuelve a leer el estado guardado
// y comprueba que sigue siendo el turno de quien elige y que el jugador sigue
// libre. Si dos móviles pulsan a la vez, uno entra y el otro recibe un error
// claro en vez de dejar los equipos a medias. Las transacciones no funcionan
// sin conexión: sin cobertura fallan, no se quedan en cola.

const refEleccion = (idConvocatoria) => doc(db, 'convocatorias', idConvocatoria, 'eleccion', 'estado')

export class ErrorEleccion extends Error {}

/**
 * @param capitanes      capitanes que ve el móvil; solo se usan si la
 *                       elección aún no ha empezado (la primera elección los fija)
 * @param turnoEsperado  número de elecciones que había en pantalla al pulsar
 * @param participantesIds ids de todos los que juegan, para saber si con esta
 *                       elección ya no queda nadie libre ("completa", que es
 *                       lo que mira el script de avisos)
 */
export async function elegirJugador(idConvocatoria, { capitanes, jugador, quienElige, turnoEsperado, participantesIds }) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refEleccion(idConvocatoria))
    const guardado = snap.exists() ? snap.data() : null
    const capitanesFijos = guardado?.capitanes?.length === 2 ? guardado.capitanes : capitanes
    const elecciones = guardado?.elecciones ?? []

    if (elecciones.length !== turnoEsperado) {
      throw new ErrorEleccion('La elección ha cambiado mientras elegías. Vuelve a mirar y elige otra vez.')
    }
    const indice = capitanDelTurno(elecciones.length)
    if (capitanesFijos[indice] !== quienElige) {
      throw new ErrorEleccion('Ahora no es tu turno.')
    }
    if (capitanesFijos.includes(jugador.id) || elecciones.some((e) => e.id === jugador.id)) {
      throw new ErrorEleccion(`${jugador.nombre} ya está en un equipo.`)
    }

    const nuevasElecciones = [
      ...elecciones,
      {
        id: jugador.id,
        tipo: jugador.tipo,
        nombre: jugador.nombre,
        equipo: EQUIPO_DE_CAPITAN[indice],
        porId: quienElige,
      },
    ]
    const conEquipo = new Set([...capitanesFijos, ...nuevasElecciones.map((e) => e.id)])
    tx.set(refEleccion(idConvocatoria), {
      capitanes: capitanesFijos,
      elecciones: nuevasElecciones,
      completa: participantesIds.every((id) => conEquipo.has(id)),
      actualizado: serverTimestamp(),
    })
  })
}

/** Deshace la última elección, solo si la hizo quien lo pide. */
export async function deshacerEleccion(idConvocatoria, { quienElige, turnoEsperado }) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refEleccion(idConvocatoria))
    const elecciones = snap.exists() ? (snap.data().elecciones ?? []) : []
    if (elecciones.length !== turnoEsperado || elecciones.length === 0) {
      throw new ErrorEleccion('La elección ha cambiado. Vuelve a mirar antes de deshacer.')
    }
    if (elecciones.at(-1).porId !== quienElige) {
      throw new ErrorEleccion('Solo puedes deshacer tu propia última elección.')
    }
    tx.update(refEleccion(idConvocatoria), {
      elecciones: elecciones.slice(0, -1),
      completa: false,
      actualizado: serverTimestamp(),
    })
  })
}

/** Borra la elección entera (desde Admin). Los capitanes vuelven a calcularse. */
export async function reiniciarEleccion(idConvocatoria) {
  await deleteDoc(refEleccion(idConvocatoria))
}

// --- Acciones de administración (requieren PIN; las reglas de Firestore lo validan) ---

export async function confirmarInvitado(idConvocatoria, invitadoId, confirmado, pin) {
  await updateDoc(doc(db, 'convocatorias', idConvocatoria, 'invitados', invitadoId), {
    confirmado,
    adminPin: pin,
  })
}

export async function guardarEncargados(idConvocatoria, encargadosIds, pin) {
  await setDoc(
    doc(db, 'convocatorias', idConvocatoria),
    { encargados: encargadosIds, adminPin: pin },
    { merge: true },
  )
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

export async function ajustarPuntos(peñistaId, puntos, motivo, pin) {
  await updateDoc(doc(db, 'penistas', peñistaId), {
    historialAjustes: arrayUnion({ puntos, motivo, fecha: new Date().toISOString() }),
    adminPin: pin,
  })
}

export async function verificarPin(pinIntroducido, config) {
  return Boolean(config?.pin) && pinIntroducido === config.pin
}

export async function cambiarConfig(cambios, pin) {
  await setDoc(doc(db, 'config', 'general'), { ...cambios, adminPin: pin }, { merge: true })
}
