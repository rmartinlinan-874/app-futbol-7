import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // For GitHub Pages project sites the base must be '/<repo-name>/'.
  // Set VITE_BASE_PATH in .env (see .env.example) once you know the repo name.
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
  }
})
