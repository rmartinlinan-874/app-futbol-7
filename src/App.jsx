import { useEffect, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db, ensureAuth } from './firebase'
import { idConvocatoriaActiva } from './lib/dates'
import { escucharAvisosEnPrimerPlano } from './lib/notificaciones'
import { useLocalPeñista } from './hooks/useLocalPeñista'
import { useAdminSession } from './hooks/useAdminSession'
import { useConfig, usePeñistas, useConvocatoria, useTodasConvocatorias } from './hooks/useFirestore'
import Identificacion from './components/Identificacion'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import ConvocatoriaScreen from './components/ConvocatoriaScreen'
import ClasificacionScreen from './components/ClasificacionScreen'
import AdminLoginScreen from './components/AdminLoginScreen'
import AdminScreen from './components/admin/AdminScreen'
import './App.css'

const NOMBRE_PEÑA_POR_DEFECTO = 'Mi Peña'
const PIN_POR_DEFECTO = '1234'

export default function App() {
  const [authListo, setAuthListo] = useState(false)
  useEffect(() => {
    ensureAuth().then(() => setAuthListo(true))
  }, [])

  useEffect(() => {
    escucharAvisosEnPrimerPlano()
  }, [])

  const [idConvocatoria, setIdConvocatoria] = useState(idConvocatoriaActiva)
  useEffect(() => {
    const intervalo = setInterval(() => setIdConvocatoria(idConvocatoriaActiva()), 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  const { config, cargando: cargandoConfig } = useConfig()
  const { peñistas, cargando: cargandoPeñistas } = usePeñistas()
  const { convocatoria, respuestas, invitados, cargando: cargandoConvocatoria } = useConvocatoria(idConvocatoria)
  const { convocatorias, cargando: cargandoTodas } = useTodasConvocatorias()

  const [peñista, setPeñista] = useLocalPeñista()
  const { pin, esAdmin, entrar, salir } = useAdminSession()
  const [pantalla, setPantalla] = useState('convocatoria')

  // Primera vez que se despliega la app: crea el documento de configuración
  // con valores por defecto (editables luego desde Admin > Ajustes).
  useEffect(() => {
    if (authListo && !cargandoConfig && config === null) {
      setDoc(doc(db, 'config', 'general'), {
        nombrePeña: NOMBRE_PEÑA_POR_DEFECTO,
        pin: PIN_POR_DEFECTO,
      }).catch(() => {
        // si otro dispositivo ya la creó a la vez, no pasa nada
      })
    }
  }, [authListo, cargandoConfig, config])

  const cargando = !authListo || cargandoConfig || cargandoPeñistas || cargandoConvocatoria
  if (cargando) {
    return (
      <div className="pantalla-carga">
        <p>Cargando…</p>
      </div>
    )
  }

  const nombrePeña = config?.nombrePeña || NOMBRE_PEÑA_POR_DEFECTO
  // peñista (localStorage) solo guarda {id, nombre} de cuando se eligió;
  // aquí se cruza con la lista en vivo para tener también la foto actual.
  const peñistaActual = peñista ? (peñistas.find((p) => p.id === peñista.id) ?? peñista) : null

  const panelAdmin = esAdmin ? (
    <AdminScreen
      idConvocatoria={idConvocatoria}
      convocatoria={convocatoria}
      respuestas={respuestas}
      invitados={invitados}
      peñistas={peñistas}
      convocatorias={convocatorias}
      config={config}
      pin={pin}
      onCambiarPin={entrar}
      onSalir={salir}
    />
  ) : (
    <AdminLoginScreen config={config} onEntrar={entrar} />
  )

  // Antes de que haya ningún peñista dado de alta, nadie puede identificarse
  // (la lista estaría vacía), así que el acceso a Admin tiene que poder
  // alcanzarse sin haber elegido nombre todavía.
  if (!peñista) {
    if (pantalla === 'admin') {
      return (
        <>
          <header className="barra-superior">
            <h1>{nombrePeña}</h1>
            <button onClick={() => setPantalla('convocatoria')}>Volver</button>
          </header>
          <main className="contenido">{panelAdmin}</main>
        </>
      )
    }
    return (
      <>
        <Identificacion nombrePeña={nombrePeña} peñistas={peñistas} onElegir={setPeñista} />
        <button
          className="boton boton-secundario"
          style={{ margin: '0 20px 20px' }}
          onClick={() => setPantalla('admin')}
        >
          Acceso admin
        </button>
      </>
    )
  }

  return (
    <>
      <TopBar nombrePeña={nombrePeña} peñista={peñistaActual} onCambiarPeñista={() => setPeñista(null)} />

      <main className="contenido">
        {pantalla === 'convocatoria' && (
          <ConvocatoriaScreen
            idConvocatoria={idConvocatoria}
            peñista={peñistaActual}
            peñistas={peñistas}
            convocatoria={convocatoria}
            respuestas={respuestas}
            invitados={invitados}
          />
        )}

        {pantalla === 'clasificacion' &&
          (cargandoTodas ? (
            <p className="subtitulo">Cargando…</p>
          ) : (
            <ClasificacionScreen convocatorias={convocatorias} peñistas={peñistas} />
          ))}

        {pantalla === 'admin' && panelAdmin}
      </main>

      <BottomNav pantalla={pantalla} onCambiar={setPantalla} />
    </>
  )
}
