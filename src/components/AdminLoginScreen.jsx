import { useState } from 'react'
import { verificarPin } from '../lib/actions'

export default function AdminLoginScreen({ config, onEntrar }) {
  const [valor, setValor] = useState('')
  const [error, setError] = useState('')

  async function comprobar(e) {
    e.preventDefault()
    const ok = await verificarPin(valor, config)
    if (ok) {
      onEntrar(valor)
    } else {
      setError('PIN incorrecto')
      setValor('')
    }
  }

  return (
    <section className="tarjeta">
      <h2 className="titulo-seccion">Acceso de administrador</h2>
      <p className="subtitulo">Introduce el PIN para gestionar la peña.</p>

      <form className="pin-pad" style={{ marginTop: 16 }} onSubmit={comprobar}>
        <input
          className="campo-texto"
          type="password"
          inputMode="numeric"
          autoFocus
          value={valor}
          onChange={(e) => {
            setValor(e.target.value)
            setError('')
          }}
        />
        {error && <p style={{ color: 'var(--rojo)', margin: 0 }}>{error}</p>}
        <button className="boton boton-primario boton-bloque" disabled={!valor}>
          Entrar
        </button>
      </form>
    </section>
  )
}
