import { useRef, useState } from 'react'
import Avatar from './Avatar'
import { subirFotoPeñista } from '../lib/fotos'

export default function TopBar({ nombrePeña, peñista, onCambiarPeñista }) {
  const inputRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)

  async function elegirArchivo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !peñista) return
    setSubiendo(true)
    try {
      await subirFotoPeñista(peñista.id, file)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <header className="barra-superior">
      <div className="barra-superior-quien">
        <button
          className="avatar-boton"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          title="Cambiar tu foto"
        >
          <Avatar nombre={peñista?.nombre ?? '?'} fotoURL={peñista?.fotoURL} tamaño={36} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={elegirArchivo}
        />
        <div>
          <h1>{nombrePeña}</h1>
          <span className="quien">{subiendo ? 'Subiendo foto…' : peñista?.nombre}</span>
        </div>
      </div>
      <button onClick={onCambiarPeñista}>Cambiar</button>
    </header>
  )
}
