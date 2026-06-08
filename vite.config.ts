import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// - base './' on build → relative asset paths so the bundle works at any
//   sub-path (e.g. GitHub Pages' https://user.github.io/<repo>/).
// - The /espn dev proxy lets the browser avoid a cross-origin request in dev.
//   In production the app calls ESPN directly (it returns permissive CORS).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/espn': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/espn/, ''),
      },
    },
  },
}))
