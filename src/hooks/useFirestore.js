import { doc, collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'

export function useConfig() {
  const [config, setConfig] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'config', 'general')
    const unsubscribe = onSnapshot(ref, (snap) => {
      setConfig(snap.exists() ? snap.data() : null)
      setCargando(false)
    })
    return unsubscribe
  }, [])

  return { config, cargando }
}

export function usePeñistas() {
  const [peñistas, setPeñistas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const ref = query(collection(db, 'penistas'), orderBy('nombre'))
    const unsubscribe = onSnapshot(ref, (snap) => {
      setPeñistas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCargando(false)
    })
    return unsubscribe
  }, [])

  return { peñistas, cargando }
}

export function useConvocatoria(idConvocatoria) {
  const [convocatoria, setConvocatoria] = useState(null)
  const [respuestas, setRespuestas] = useState([])
  const [invitados, setInvitados] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!idConvocatoria) return
    setCargando(true)
    const unsubConv = onSnapshot(doc(db, 'convocatorias', idConvocatoria), (snap) => {
      setConvocatoria(snap.exists() ? { id: snap.id, ...snap.data() } : { id: idConvocatoria })
      setCargando(false)
    })
    const unsubResp = onSnapshot(
      query(collection(db, 'convocatorias', idConvocatoria, 'respuestas'), orderBy('timestamp')),
      (snap) => setRespuestas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    )
    const unsubInv = onSnapshot(
      query(collection(db, 'convocatorias', idConvocatoria, 'invitados'), orderBy('timestamp')),
      (snap) => setInvitados(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    )
    return () => {
      unsubConv()
      unsubResp()
      unsubInv()
    }
  }, [idConvocatoria])

  return { convocatoria, respuestas, invitados, cargando }
}

export function useTodasConvocatorias() {
  const [convocatorias, setConvocatorias] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Sin orderBy: el id del documento ya es la fecha (YYYY-MM-DD), y no
    // todos los documentos tienen escrito un campo "fecha" (orderBy los
    // habría excluido de la consulta). El orden no importa para sumar puntos.
    const ref = collection(db, 'convocatorias')
    const unsubscribe = onSnapshot(ref, (snap) => {
      setConvocatorias(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCargando(false)
    })
    return unsubscribe
  }, [])

  return { convocatorias, cargando }
}
