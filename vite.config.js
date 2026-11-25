import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Identificador de esta versión (la hora de la compilación). Va dentro del
// código de la app y también en dist/version.json: la app compara los dos
// para saber si se ha publicado una versión nueva (ver src/lib/version.js).
const VERSION = String(Date.now())

function archivoVersion() {
  return {
    name: 'archivo-version',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // For GitHub Pages project sites the base must be '/<repo-name>/'.
  // Set VITE_BASE_PATH in .env (see .env.example) once you know the repo name.
  return {
    plugins: [react(), archivoVersion()],
    base: env.VITE_BASE_PATH || '/',
    define: {
      'import.meta.env.VITE_VERSION_APP': JSON.stringify(VERSION),
    },
  }
})
