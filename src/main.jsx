import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const FIREBASE_CONFIGURADO =
  import.meta.env.VITE_USE_EMULATOR === 'true' || Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

function ConfiguracionFaltante() {
  return (
    <div className="pantalla-error">
      <div>
        <h1>Falta configurar Firebase</h1>
        <p>
          Copia <code>.env.example</code> a <code>.env</code>, rellena los datos de tu proyecto
          Firebase y reinicia <code>npm run dev</code>. Consulta el README para más detalles.
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{FIREBASE_CONFIGURADO ? <App /> : <ConfiguracionFaltante />}</StrictMode>,
)
