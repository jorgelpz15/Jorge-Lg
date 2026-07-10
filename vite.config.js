import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  define: {
    // Para saber de un vistazo si el celular ya cargó la última versión.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
  },
})
