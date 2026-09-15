import { useState } from 'react'
import AdminConvocatoria from './AdminConvocatoria'
import AdminPeñistas from './AdminPeñistas'
import AdminAjustes from './AdminAjustes'

const PESTAÑAS = [
  { id: 'convocatoria', etiqueta: 'Convocatoria' },
  { id: 'peñistas', etiqueta: 'Peñistas' },
  { id: 'ajustes', etiqueta: 'Ajustes' },
]

export default function AdminScreen({
  idConvocatoria,
  convocatoria,
  respuestas,
  invitados,
  peñistas,
  convocatorias,
  config,
  pin,
  onCambiarPin,
  onSalir,
}) {
  const [pestaña, setPestaña] = useState('convocatoria')

  return (
    <>
      <div className="pestañas-admin">
        {PESTAÑAS.map((p) => (
          <button
            key={p.id}
            className={pestaña === p.id ? 'activo' : ''}
            onClick={() => setPestaña(p.id)}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestaña === 'convocatoria' && (
        <AdminConvocatoria
          idConvocatoria={idConvocatoria}
          convocatoria={convocatoria}
          respuestas={respuestas}
          invitados={invitados}
          peñistas={peñistas}
          convocatorias={convocatorias}
          pin={pin}
        />
      )}

      {pestaña === 'peñistas' && <AdminPeñistas peñistas={peñistas} pin={pin} />}

      {pestaña === 'ajustes' && (
        <AdminAjustes config={config} pin={pin} onCambiarPin={onCambiarPin} onSalir={onSalir} />
      )}
    </>
  )
}
